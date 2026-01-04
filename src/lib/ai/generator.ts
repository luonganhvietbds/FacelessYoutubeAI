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

// API Keys with rotation
const API_KEYS = [
    'AIzaSyDYZvQjDqG1yeZXyVBp1VRa7Vf9H-Xdzxo',
    'AIzaSyAM7MccHk2kQUOHVfXTPl0KZLfzWqY2GEo',
    'AIzaSyCywMMIs7n47QvxGMSyCsKS6ml2cZXzTrc',
    'AIzaSyCael8ozNJ5HBtMRqm4LagdCj4dRNUmmx4',
    'AIzaSyCGgCbAanW7lqJWKEGaJjux7ey4nMfobO8',
    'AIzaSyA9-90C18uEZSrlWZD3Y-9rnaT-WxGw8LQ',
    'AIzaSyAPZgG_s06eJnHyr5CUnMXjAMi8zEIB6BI',
    'AIzaSyA5aAvSe2788T6k90AFolkdMo_s6a4E900',
    'AIzaSyB9p1sSEiupLRr66NhJIFVIVqmebkvIXwg',
    'AIzaSyCiclQCO3u4m9st_hjM-9SdWZk81xTwGZo',
    'AIzaSyBLyqqsKHcfSCcRJS4GrFicUUbkjG9HUgk',
    'AIzaSyB0-E-EUq55rETQwUIctjwOZ5HFtV2m3f4',
    'AIzaSyCGZAQ6mkfEm7eh_252ZI8Yw1pi_0eENVU',
    'AIzaSyApFMt1bcFSdR7COXlQELrmQslCd1kh974',
    'AIzaSyDqSSyydUQwXMIfhW92bMs37ErJ5GoYOVA',
    'AIzaSyAJMN0vCdMLiEI2YS5QFhUrbJ2VXJH-vAU',
    'AIzaSyBk0HxTxoZPHmXdum9jKFPMiM1S38nuTwA',
];

let currentKeyIndex = 0;
const failedKeys = new Set<number>();

// User key rotation state (per user)
const userKeyState = new Map<string, { keys: string[]; index: number; failed: Set<number> }>();

function getNextWorkingKey(userKeys?: string[]): string {
    // If user keys provided, use those first
    if (userKeys && userKeys.length > 0) {
        // Simple rotation through user keys
        const index = Math.floor(Math.random() * userKeys.length);
        return userKeys[index];
    }

    // Fallback to system keys
    const startIndex = currentKeyIndex;

    do {
        if (!failedKeys.has(currentKeyIndex)) {
            const key = API_KEYS[currentKeyIndex];
            currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
            return key;
        }
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    } while (currentKeyIndex !== startIndex);

    // All keys failed, reset and try again
    failedKeys.clear();
    const key = API_KEYS[0];
    currentKeyIndex = 1;
    return key;
}

function markKeyAsFailed(keyIndex: number): void {
    failedKeys.add(keyIndex);
}

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
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

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
// Models to try in order (highest to lowest capability)
const MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
];

export async function generate(params: GenerateParams): Promise<VideoIdea[] | OutlineSection[] | ScriptContent | VideoMetadata> {
    const userKeys = params.userApiKeys || [];
    const allKeys = [...userKeys]; // User keys first

    // Add system keys only if no user keys or as final fallback
    if (userKeys.length === 0) {
        allKeys.push(...API_KEYS);
    }

    let lastError: Error | null = null;
    const triedKeys = new Set<string>();

    // Try each model in order
    for (const modelName of MODELS) {
        console.log(`🔄 Trying model: ${modelName}`);

        // Try each key for this model
        for (const apiKey of allKeys) {
            // Skip already tried keys for this model
            const keyId = `${modelName}:${apiKey.slice(-8)}`;
            if (triedKeys.has(keyId)) continue;
            triedKeys.add(keyId);

            try {
                console.log(`  🔑 Trying key: ...${apiKey.slice(-8)}`);

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.8,
                        topP: 0.95,
                        maxOutputTokens: 8192,
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

                console.log(`  ✅ Success with model: ${modelName}, key: ...${apiKey.slice(-8)}`);
                return parseResponse(text, params.step);

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                const errorMsg = lastError.message.toLowerCase();

                // Log the error
                console.log(`  ❌ Failed: ${lastError.message.slice(0, 100)}`);

                // Check error type
                if (errorMsg.includes('leaked') || errorMsg.includes('invalid')) {
                    console.log(`    → Key is leaked/invalid, skipping for all models`);
                    // Mark this key as bad for all models
                    for (const m of MODELS) {
                        triedKeys.add(`${m}:${apiKey.slice(-8)}`);
                    }
                    continue;
                }

                if (errorMsg.includes('429') || errorMsg.includes('rate') || errorMsg.includes('quota')) {
                    console.log(`    → Rate limited, trying next key`);
                    continue;
                }

                if (errorMsg.includes('403') || errorMsg.includes('permission')) {
                    console.log(`    → Permission denied, trying next key`);
                    continue;
                }

                if (errorMsg.includes('model') || errorMsg.includes('not found') || errorMsg.includes('400')) {
                    console.log(`    → Model not available for this key, trying next model`);
                    break; // Try next model
                }

                // Other error - try next key
                console.log(`    → Unknown error, trying next key`);
            }
        }

        console.log(`⚠️ Model ${modelName} exhausted all keys, trying next model...`);
    }

    // All models and keys exhausted
    const errorMessage = lastError?.message || 'All API keys and models failed';
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
