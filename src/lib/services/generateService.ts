// Videlix AI - Generate Service (Simplified)
// Uses localStorage API key instead of Firestore

import { getApiKey } from '@/lib/api-keys/simpleKeyStore';
import { callGemini } from '@/lib/services/geminiService';
import { PipelineStep, VideoIdea, OutlineSection, ScriptContent, VideoMetadata } from '@/types';
import { getProfileById, FirebaseProfile } from '@/lib/firebase/firestore';
import profiles from '@/lib/prompts/profiles.json';

// Cache for Firebase profiles
const profileCache = new Map<string, { profile: FirebaseProfile | null; timestamp: number }>();
const CACHE_TTL = 60000;

interface GenerateRequest {
    step: PipelineStep;
    profileId: string;
    language: 'en' | 'vi';
    topic: string;
    previousContent?: {
        selectedIdea?: VideoIdea;
        outline?: OutlineSection[];
        script?: ScriptContent;
    };
    modifier?: string;
}

interface GenerateResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Get system prompt from profile
 */
async function getSystemPrompt(profileId: string, step: PipelineStep, language: 'en' | 'vi'): Promise<string> {
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

        if (firebaseProfile?.prompts?.[step]) {
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

/**
 * Build user prompt for AI
 */
function buildUserPrompt(params: GenerateRequest): string {
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
                const scriptIntro = previousContent.script.intro || previousContent.script.rawContent || '';
                const scriptSummary = `${scriptIntro.substring(0, 200)}...`;
                prompt = isVietnamese
                    ? `Tóm tắt kịch bản:\n${scriptSummary}\n\nTạo metadata tối ưu cho video này. Trả về JSON object với title, description, tags, thumbnailPrompt, estimatedDuration.`
                    : `Script summary:\n${scriptSummary}\n\nGenerate optimized metadata for this video. Return as JSON object with title, description, tags, thumbnailPrompt, estimatedDuration.`;
            }
            break;
    }

    // Add modifier instructions
    if (modifier && modifier !== 'default') {
        const modifierText: Record<string, string> = {
            shorter: isVietnamese ? 'Làm ngắn gọn hơn, súc tích hơn.' : 'Make it shorter and more concise.',
            longer: isVietnamese ? 'Làm chi tiết hơn, đầy đủ hơn.' : 'Make it longer and more detailed.',
            funnier: isVietnamese ? 'Thêm yếu tố hài hước, vui nhộn.' : 'Add more humor and fun elements.',
            professional: isVietnamese ? 'Làm chuyên nghiệp hơn, nghiêm túc hơn.' : 'Make it more professional and formal.',
        };
        prompt += `\n\n${modifierText[modifier] || ''}`;
    }

    return prompt;
}

/**
 * Parse AI response based on step
 */
function parseStepResponse<T>(response: unknown, step: PipelineStep): T {
    switch (step) {
        case 'idea':
            if (!Array.isArray(response)) throw new Error('Ideas must be an array');
            return response.map((item: Partial<VideoIdea>, index: number) => ({
                id: item.id || `idea_${index}`,
                title: item.title || '',
                hook: item.hook || '',
                angle: item.angle || '',
                selected: false,
            })) as T;

        case 'outline':
            if (!Array.isArray(response)) throw new Error('Outline must be an array');
            return response.map((section: Record<string, unknown>, index: number) => {
                // Handle both formats: {title, points} OR {heading, content}
                const title = (section.title || section.heading || `Section ${index + 1}`) as string;
                let points: string[] = [];

                if (Array.isArray(section.points)) {
                    points = section.points as string[];
                } else if (typeof section.content === 'string') {
                    // Split content into points if it's a string
                    points = section.content.split('\n').filter((p: string) => p.trim());
                } else if (Array.isArray(section.content)) {
                    points = section.content as string[];
                }

                return {
                    id: (section.id as string) || `section_${index}`,
                    title,
                    points,
                };
            }) as T;

        case 'script':
            return {
                intro: (response as Partial<ScriptContent>).intro || '',
                sections: (response as Partial<ScriptContent>).sections?.map((s, i) => ({
                    heading: s?.heading || `Part ${i + 1}`,
                    content: s?.content || '',
                    visualNotes: s?.visualNotes,
                })) || [],
                outro: (response as Partial<ScriptContent>).outro || '',
                callToAction: (response as Partial<ScriptContent>).callToAction || '',
                rawContent: (response as Partial<ScriptContent>).rawContent,
                scenes: (response as Partial<ScriptContent>).scenes,
            } as T;

        case 'metadata':
            return {
                title: (response as Partial<VideoMetadata>).title || '',
                description: (response as Partial<VideoMetadata>).description || '',
                tags: Array.isArray((response as Partial<VideoMetadata>).tags)
                    ? (response as Partial<VideoMetadata>).tags
                    : [],
                thumbnailPrompt: (response as Partial<VideoMetadata>).thumbnailPrompt || '',
                estimatedDuration: (response as Partial<VideoMetadata>).estimatedDuration || '',
            } as T;

        default:
            throw new Error(`Unknown step: ${step}`);
    }
}

/**
 * Generate content using Gemini AI
 * API key is automatically retrieved from localStorage
 */
export async function generateContent<T>(
    request: GenerateRequest
): Promise<GenerateResponse<T>> {
    try {
        // Get API key from localStorage
        const apiKey = getApiKey();

        if (!apiKey) {
            return {
                success: false,
                error: 'No API Key found. Please add your Gemini API Key in the header.',
            };
        }

        console.log(`🚀 Generating ${request.step} with API key from localStorage`);

        // Get prompts
        const systemPrompt = await getSystemPrompt(request.profileId, request.step, request.language);
        const userPrompt = buildUserPrompt(request);

        // Call Gemini
        const response = await callGemini<unknown>({
            systemPrompt,
            userPrompt,
            apiKey,
        });

        // Parse response
        const data = parseStepResponse<T>(response, request.step);

        return {
            success: true,
            data,
        };

    } catch (error) {
        console.error('Generate error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}
