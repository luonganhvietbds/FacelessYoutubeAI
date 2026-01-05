// Videlix AI - Generate Service
// Handles API calls to generate endpoint with user API keys and batch processing

import { getActiveUserApiKeys } from '@/lib/api-keys/keyStore';
import { BatchProgress, PipelineStep, RATE_LIMITS } from '@/types';
import { processBatches, retryWithBackoff, delay } from '@/lib/utils/batchProcessor';

interface GenerateRequest {
    step: PipelineStep;
    profileId: string;
    language: 'en' | 'vi';
    topic: string;
    previousContent?: {
        selectedIdea?: unknown;
        outline?: unknown;
        script?: unknown;
    };
    modifier?: string;
    batchIndex?: number;
    totalBatches?: number;
}

interface GenerateResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

interface GenerateOptions {
    onProgress?: (progress: BatchProgress) => void;
    userId?: string | null;
}

/**
 * Call the generate API with user's API keys
 */
export async function generateContent<T>(
    request: GenerateRequest,
    userId?: string | null
): Promise<GenerateResponse<T>> {
    try {
        // Get user's active API keys if logged in
        let userApiKeys: string[] = [];

        console.log('🔍 [generateContent] userId:', userId);

        if (userId) {
            try {
                userApiKeys = await getActiveUserApiKeys(userId);
                console.log(`📦 [generateContent] Found ${userApiKeys.length} active API keys for user ${userId}`);
                if (userApiKeys.length > 0) {
                    console.log(`  🔑 First key ends with: ...${userApiKeys[0].slice(-8)}`);
                }
            } catch (error) {
                console.error('❌ [generateContent] Failed to get user API keys:', error);
            }
        } else {
            console.warn('⚠️ [generateContent] No userId provided - cannot fetch API keys');
        }

        if (userApiKeys.length === 0) {
            console.error('❌ [generateContent] No API keys to send to generator!');
        }

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...request,
                userApiKeys, // Include user's API keys
            }),
        });

        const data = await response.json();
        return data as GenerateResponse<T>;

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Generate content with retry on rate limit
 */
export async function generateWithRetry<T>(
    request: GenerateRequest,
    userId?: string | null
): Promise<GenerateResponse<T>> {
    return retryWithBackoff(
        async () => {
            const result = await generateContent<T>(request, userId);
            if (!result.success && result.error?.includes('429')) {
                throw new Error(result.error);
            }
            return result;
        },
        {
            maxRetries: RATE_LIMITS.MAX_RETRIES,
            initialDelay: RATE_LIMITS.RETRY_DELAY,
            onRetry: (attempt, error) => {
                console.log(`⏳ API retry ${attempt}: ${error.message}`);
            },
        }
    );
}

/**
 * Generate scenes in batches with rate limit protection
 * Used for outline and script steps with many scenes
 */
export async function generateInBatches<T>(
    scenePrompts: string[],
    baseRequest: Omit<GenerateRequest, 'batchIndex' | 'totalBatches'>,
    options: GenerateOptions = {}
): Promise<T[]> {
    const { onProgress, userId } = options;
    const step = baseRequest.step;

    console.log(`📦 Generating ${scenePrompts.length} items in batches of ${RATE_LIMITS.BATCH_SIZE}`);

    const results = await processBatches<string, T>(
        scenePrompts,
        async (batch, batchIndex) => {
            const batchResults: T[] = [];

            for (const prompt of batch) {
                const response = await generateWithRetry<T>({
                    ...baseRequest,
                    topic: prompt, // Each scene prompt as topic
                    batchIndex,
                    totalBatches: Math.ceil(scenePrompts.length / RATE_LIMITS.BATCH_SIZE),
                }, userId);

                if (response.success && response.data) {
                    batchResults.push(response.data);
                } else {
                    console.error(`Batch ${batchIndex} item failed:`, response.error);
                }
            }

            return batchResults;
        },
        {
            batchSize: RATE_LIMITS.BATCH_SIZE,
            delayMs: RATE_LIMITS.BATCH_DELAY,
            step,
            onProgress,
            onBatchComplete: (batchIndex) => {
                console.log(`✅ Batch ${batchIndex + 1} complete`);
            },
        }
    );

    return results;
}

/**
 * Process multiple ideas in factory mode with cooldown
 */
export async function processFactoryIdeas<T>(
    ideas: { id: string; title: string }[],
    processIdea: (idea: { id: string; title: string }) => Promise<T>,
    options: {
        onIdeaStart?: (index: number, idea: { id: string; title: string }) => void;
        onIdeaComplete?: (index: number, result: T) => void;
        onCooldown?: (remaining: number) => void;
        isPaused?: () => boolean;
    } = {}
): Promise<T[]> {
    const results: T[] = [];
    const { onIdeaStart, onIdeaComplete, onCooldown, isPaused = () => false } = options;

    console.log(`🏭 Factory mode: Processing ${ideas.length} ideas`);

    for (let i = 0; i < ideas.length; i++) {
        // Check pause
        while (isPaused()) {
            await delay(500);
        }

        const idea = ideas[i];
        console.log(`🔄 Processing idea ${i + 1}/${ideas.length}: ${idea.title}`);

        onIdeaStart?.(i, idea);

        const result = await processIdea(idea);
        results.push(result);

        onIdeaComplete?.(i, result);

        // Cooldown between ideas (except after last)
        if (i < ideas.length - 1) {
            console.log(`⏸️ Cooling down for ${RATE_LIMITS.FACTORY_COOLDOWN / 1000}s...`);
            let remaining = RATE_LIMITS.FACTORY_COOLDOWN;
            while (remaining > 0) {
                onCooldown?.(remaining);
                await delay(1000);
                remaining -= 1000;
            }
            onCooldown?.(0);
        }
    }

    console.log(`✅ Factory complete: ${results.length} ideas processed`);
    return results;
}
