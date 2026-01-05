// Videlix AI - Batch Processing Utilities
// Handles rate-limited batch API calls with delays and progress tracking

import { RATE_LIMITS, BatchProgress, PipelineStep } from '@/types';

/**
 * Delay utility with countdown callback
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Delay with countdown callback for UI updates
 */
export async function delayWithCountdown(
    ms: number,
    onTick?: (remaining: number) => void
): Promise<void> {
    const interval = 1000; // 1 second intervals
    let remaining = ms;

    while (remaining > 0) {
        onTick?.(remaining);
        await delay(Math.min(interval, remaining));
        remaining -= interval;
    }
    onTick?.(0);
}

/**
 * Process items in batches with delay between each batch
 */
export async function processBatches<T, R>(
    items: T[],
    processFn: (batch: T[], batchIndex: number) => Promise<R[]>,
    options: {
        batchSize?: number;
        delayMs?: number;
        onProgress?: (progress: BatchProgress) => void;
        step?: PipelineStep;
        onBatchComplete?: (batchIndex: number, results: R[]) => void;
    } = {}
): Promise<R[]> {
    const {
        batchSize = RATE_LIMITS.BATCH_SIZE,
        delayMs = RATE_LIMITS.BATCH_DELAY,
        onProgress,
        step = 'script',
        onBatchComplete,
    } = options;

    const totalBatches = Math.ceil(items.length / batchSize);
    const allResults: R[] = [];

    for (let i = 0; i < totalBatches; i++) {
        const startIdx = i * batchSize;
        const endIdx = Math.min(startIdx + batchSize, items.length);
        const batch = items.slice(startIdx, endIdx);

        // Update progress - processing
        onProgress?.({
            step,
            currentBatch: i + 1,
            totalBatches,
            itemsProcessed: startIdx,
            totalItems: items.length,
            isDelaying: false,
            delayRemaining: 0,
        });

        // Process this batch
        const batchResults = await processFn(batch, i);
        allResults.push(...batchResults);

        // Callback after batch complete
        onBatchComplete?.(i, batchResults);

        // Update progress - items processed
        onProgress?.({
            step,
            currentBatch: i + 1,
            totalBatches,
            itemsProcessed: endIdx,
            totalItems: items.length,
            isDelaying: i < totalBatches - 1, // Not last batch
            delayRemaining: delayMs,
        });

        // Delay between batches (except after last)
        if (i < totalBatches - 1) {
            await delay(delayMs);
        }
    }

    // Final progress update
    onProgress?.({
        step,
        currentBatch: totalBatches,
        totalBatches,
        itemsProcessed: items.length,
        totalItems: items.length,
        isDelaying: false,
        delayRemaining: 0,
    });

    return allResults;
}

/**
 * Retry with exponential backoff for rate limit errors
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelay?: number;
        isRetryable?: (error: Error) => boolean;
        onRetry?: (attempt: number, error: Error) => void;
    } = {}
): Promise<T> {
    const {
        maxRetries = RATE_LIMITS.MAX_RETRIES,
        initialDelay = RATE_LIMITS.RETRY_DELAY,
        isRetryable = (e) => e.message.includes('429') || e.message.includes('rate'),
        onRetry,
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < maxRetries && isRetryable(lastError)) {
                const backoffDelay = initialDelay * Math.pow(2, attempt);
                onRetry?.(attempt + 1, lastError);
                console.log(`⏳ Retry ${attempt + 1}/${maxRetries} after ${backoffDelay}ms...`);
                await delay(backoffDelay);
            } else {
                throw lastError;
            }
        }
    }

    throw lastError!;
}

/**
 * Factory mode processor - process multiple ideas with cooldown
 */
export async function processFactoryQueue<T>(
    items: T[],
    processItem: (item: T, index: number) => Promise<void>,
    options: {
        cooldownMs?: number;
        onItemStart?: (index: number) => void;
        onItemComplete?: (index: number) => void;
        onCooldown?: (remaining: number) => void;
        isPaused?: () => boolean;
    } = {}
): Promise<void> {
    const {
        cooldownMs = RATE_LIMITS.FACTORY_COOLDOWN,
        onItemStart,
        onItemComplete,
        onCooldown,
        isPaused = () => false,
    } = options;

    for (let i = 0; i < items.length; i++) {
        // Check pause
        while (isPaused()) {
            await delay(500);
        }

        onItemStart?.(i);
        await processItem(items[i], i);
        onItemComplete?.(i);

        // Cooldown between items (except after last)
        if (i < items.length - 1) {
            await delayWithCountdown(cooldownMs, onCooldown);
        }
    }
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(progress: BatchProgress): number {
    if (progress.totalItems === 0) return 0;
    return Math.round((progress.itemsProcessed / progress.totalItems) * 100);
}

/**
 * Format remaining time for display
 */
export function formatRemainingTime(ms: number): string {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}
