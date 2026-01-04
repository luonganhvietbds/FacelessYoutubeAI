import { GoogleGenerativeAI } from '@google/generative-ai';
import { PipelineStep, Language, VideoIdea, OutlineSection, ScriptContent, VideoMetadata } from '@/types';
import profiles from '@/lib/prompts/profiles.json';
import { getProfileById, FirebaseProfile } from '@/lib/firebase/firestore';

// Cache for Firebase profiles to reduce reads
const profileCache = new Map<string, { profile: FirebaseProfile | null; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

async function getSystemPrompt(profileId: string, step: PipelineStep, language: Language): Promise<string> {
    // Try to get from Firestore first
    try {
        const cached = profileCache.get(profileId);
        const now = Date.now();

        let firebaseProfile: FirebaseProfile | null = null;

        if (cached && now - cached.timestamp < CACHE_TTL) {
            firebaseProfile = cached.profile;
        } else {
            firebaseProfile = await getProfileById(profileId);
            profileCache.set(profileId, { profile: firebaseProfile, timestamp: now });
        }

        if (firebaseProfile && firebaseProfile.prompts && firebaseProfile.prompts[step]) {
            return firebaseProfile.prompts[step][language];
        }
    } catch (error) {
        console.warn('Failed to fetch profile from Firestore, using fallback:', error);
    }

    // Fallback to static JSON
    const profile = profiles.profiles.find(p => p.id === profileId);
    if (!profile) {
        throw new Error(`Profile not found: ${profileId}`);
    }
    return profile.prompts[step][language];
}

// BYOK System - No hardcoded keys
// All API keys are provided by users via the API Key Manager


export interface GenerateParams {
    step: PipelineStep;
    profileId: string;
    language: Language;
    topic: string;
    previousContent?: {
        selectedIdea?: VideoIdea;
        outline?: OutlineSection[];
        script?: ScriptContent;
    };
    modifier?: 'shorter' | 'longer' | 'funnier' | 'professional' | 'default';
    userApiKeys?: string[]; // User's own API keys (BYOK)
}

function buildUserPrompt(params: GenerateParams): string {
    const { step, topic, previousContent, modifier, language } = params;
    const isVietnamese = language === 'vi';

    let prompt = '';

    switch (step) {
        case 'idea':
            prompt = isVietnamese
                ? `Chủ đề: ${topic}\n\nTạo 5 ý tưởng video độc đáo cho chủ đề này. Trả về JSON array.`
                : `Topic: ${topic}\n\nGenerate 5 unique video ideas for this topic. Return as JSON array.`;
            break;

        case 'outline':
            if (previousContent?.selectedIdea) {
                const idea = previousContent.selectedIdea;
                prompt = isVietnamese
                    ? `Ý tưởng đã chọn:\nTiêu đề: ${idea.title}\nHook: ${idea.hook}\nGóc nhìn: ${idea.angle}\n\nTạo dàn ý chi tiết cho video này. Trả về JSON array của các sections.`
                    : `Selected Idea:\nTitle: ${idea.title}\nHook: ${idea.hook}\nAngle: ${idea.angle}\n\nCreate a detailed outline for this video. Return as JSON array of sections.`;
            }
            break;

        case 'script':
            if (previousContent?.outline) {
                const outlineText = previousContent.outline
                    .map(s => `${s.title}:\n${s.points.map(p => `  - ${p}`).join('\n')}`)
                    .join('\n\n');
                prompt = isVietnamese
                    ? `Dàn ý:\n${outlineText}\n\nViết kịch bản đầy đủ dựa trên dàn ý này. Trả về JSON object với intro, sections, outro, callToAction.`
                    : `Outline:\n${outlineText}\n\nWrite a complete script based on this outline. Return as JSON object with intro, sections, outro, callToAction.`;
            }
            break;

        case 'metadata':
            if (previousContent?.script) {
                const scriptSummary = `${previousContent.script.intro.substring(0, 200)}...`;
                prompt = isVietnamese
                    ? `Tóm tắt kịch bản:\n${scriptSummary}\n\nTạo metadata tối ưu cho video này. Trả về JSON object với title, description, tags, thumbnailPrompt, estimatedDuration.`
                    : `Script summary:\n${scriptSummary}\n\nGenerate optimized metadata for this video. Return as JSON object with title, description, tags, thumbnailPrompt, estimatedDuration.`;
            }
            break;
    }

    // Add modifier instructions
    if (modifier && modifier !== 'default') {
        const modifierText = {
            shorter: isVietnamese ? 'Làm ngắn gọn hơn, súc tích hơn.' : 'Make it shorter and more concise.',
            longer: isVietnamese ? 'Làm chi tiết hơn, đầy đủ hơn.' : 'Make it longer and more detailed.',
            funnier: isVietnamese ? 'Thêm yếu tố hài hước, vui nhộn.' : 'Add more humor and fun elements.',
            professional: isVietnamese ? 'Làm chuyên nghiệp hơn, nghiêm túc hơn.' : 'Make it more professional and formal.',
        };
        prompt += `\n\n${modifierText[modifier]}`;
    }

    return prompt;
}

function parseResponse(text: string, step: PipelineStep): VideoIdea[] | OutlineSection[] | ScriptContent | VideoMetadata {
    // Clean the text - remove markdown code blocks if present
    let cleanText = text.trim();

    // Remove markdown code block wrapper
    if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
    } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
    }
    if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();

    // Function to repair common JSON issues
    function repairJSON(str: string): string {
        // Fix missing commas between properties: "value"\n"key" -> "value",\n"key"
        str = str.replace(new RegExp('(")\\s*\\n\\s*(")', 'g'), '$1,\n$2');

        // Fix missing commas after objects: }\n{ -> },\n{
        str = str.replace(new RegExp('}\\s*\\n\\s*{', 'g'), '},\n{');

        // Fix missing commas after arrays: ]\n[ -> ],\n[
        str = str.replace(new RegExp(']\\s*\\n\\s*\\[', 'g'), '],\n[');

        // Fix trailing commas before ] or }
        str = str.replace(new RegExp(',\\s*([}\\]])', 'g'), '$1');

        return str;
    }

    // Try to parse, repair if needed
    let jsonStr = cleanText;
    let parsed;

    try {
        parsed = JSON.parse(jsonStr);
    } catch (firstError) {
        console.log('First parse failed, attempting repair...');

        // Try to repair the JSON
        jsonStr = repairJSON(cleanText);

        try {
            parsed = JSON.parse(jsonStr);
            console.log('JSON repair successful!');
        } catch (secondError) {
            // Log for debugging
            console.error('JSON parse failed after repair. Response preview:', cleanText.slice(0, 500));

            // Try to extract JSON object or array
            const arrayMatch = cleanText.match(/\[\s*\{[\s\S]*?\}\s*\]/);
            const objectMatch = cleanText.match(/\{[\s\S]*?\}/);

            if (arrayMatch) {
                jsonStr = repairJSON(arrayMatch[0]);
                try {
                    parsed = JSON.parse(jsonStr);
                } catch {
                    throw new Error('Could not parse array JSON: ' + cleanText.slice(0, 100));
                }
            } else if (objectMatch) {
                jsonStr = repairJSON(objectMatch[0]);
                try {
                    parsed = JSON.parse(jsonStr);
                } catch {
                    throw new Error('Could not parse object JSON: ' + cleanText.slice(0, 100));
                }
            } else {
                throw new Error('No valid JSON found in response. Response starts with: ' + cleanText.slice(0, 100));
            }
        }
    }

    switch (step) {
        case 'idea':
            // Ensure proper structure for ideas
            if (!Array.isArray(parsed)) throw new Error('Ideas must be an array');
            return parsed.map((item: Partial<VideoIdea>, index: number) => ({
                id: item.id || `idea_${index}`,
                title: item.title || '',
                hook: item.hook || '',
                angle: item.angle || '',
                selected: false,
            }));

        case 'outline':
            if (!Array.isArray(parsed)) throw new Error('Outline must be an array');
            return parsed.map((item: Partial<OutlineSection>, index: number) => ({
                id: item.id || `section_${index}`,
                title: item.title || '',
                points: Array.isArray(item.points) ? item.points : [],
                duration: item.duration,
            }));

        case 'script':
            return {
                intro: parsed.intro || '',
                sections: Array.isArray(parsed.sections) ? parsed.sections : [],
                outro: parsed.outro || '',
                callToAction: parsed.callToAction || '',
            };

        case 'metadata':
            return {
                title: parsed.title || '',
                description: parsed.description || '',
                tags: Array.isArray(parsed.tags) ? parsed.tags : [],
                thumbnailPrompt: parsed.thumbnailPrompt || '',
                estimatedDuration: parsed.estimatedDuration || '',
            };

        default:
            throw new Error(`Unknown step: ${step}`);
    }
}
// Single model - gemini-2.5-flash is the most reliable
const MODEL_NAME = 'gemini-2.5-flash';

export async function generate(params: GenerateParams): Promise<VideoIdea[] | OutlineSection[] | ScriptContent | VideoMetadata> {
    const userKeys = params.userApiKeys || [];

    // BYOK: Only use user-provided keys
    if (userKeys.length === 0) {
        throw new Error(
            'No API keys available. Please add your Gemini API keys in the header menu.'
        );
    }

    console.log(`📦 BYOK: Using ${userKeys.length} user-provided API keys with model: ${MODEL_NAME}`);

    let lastError: Error | null = null;

    // Try each key
    for (const apiKey of userKeys) {
        try {
            console.log(`  🔑 Trying key: ...${apiKey.slice(-8)}`);

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: MODEL_NAME,
                generationConfig: {
                    temperature: 0.8,
                    topP: 0.95,
                    maxOutputTokens: 65536, // Increased to avoid truncation
                    responseMimeType: 'application/json', // Force JSON output
                },
            });

            const systemPrompt = await getSystemPrompt(params.profileId, params.step, params.language);
            const userPrompt = buildUserPrompt(params);

            const result = await model.generateContent([
                { text: `System: ${systemPrompt}` },
                { text: `User: ${userPrompt}` },
            ]);

            const response = result.response;
            const text = response.text();

            console.log(`  ✅ Success with model: ${MODEL_NAME}, key: ...${apiKey.slice(-8)}`);
            return parseResponse(text, params.step);

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const errorMsg = lastError.message.toLowerCase();

            // Log the error
            console.log(`  ❌ Failed: ${lastError.message.slice(0, 100)}`);

            // Check error type and log accordingly
            if (errorMsg.includes('leaked') || errorMsg.includes('invalid')) {
                console.log(`    → Key is leaked/invalid, trying next key`);
            } else if (errorMsg.includes('429') || errorMsg.includes('rate') || errorMsg.includes('quota')) {
                console.log(`    → Rate limited, trying next key`);
            } else if (errorMsg.includes('403') || errorMsg.includes('permission')) {
                console.log(`    → Permission denied, trying next key`);
            } else {
                console.log(`    → Unknown error, trying next key`);
            }
            // Continue to next key
        }
    }

    // All keys exhausted
    const errorMessage = lastError?.message || 'All API keys failed';
    console.error(`❌ Generation failed: ${errorMessage}`);

    throw new Error(
        `Generation failed. Please add working API keys.\n` +
        `Last error: ${errorMessage.slice(0, 200)}`
    );
}

export function getProfiles() {
    return profiles.profiles;
}

export function getProfile(profileId: string) {
    return profiles.profiles.find(p => p.id === profileId);
}
