// Videlix AI - API Key Validator
// Validates Gemini API keys with minimal API call

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ValidationResult {
    key: string;
    valid: boolean;
    error?: string;
    maskedKey: string;
}

/**
 * Mask API key for display (AIza...XXXXX)
 */
export function maskApiKey(key: string): string {
    if (key.length < 10) return '***';
    return `${key.slice(0, 8)}...${key.slice(-5)}`;
}

/**
 * Generate a hash for key deduplication
 */
export function hashApiKey(key: string): string {
    // Simple hash for deduplication (not for security)
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

/**
 * Validate a single Gemini API key
 */
export async function validateApiKey(key: string): Promise<ValidationResult> {
    const trimmedKey = key.trim();
    const maskedKey = maskApiKey(trimmedKey);

    // Basic format check
    if (!trimmedKey.startsWith('AIza') || trimmedKey.length < 30) {
        return {
            key: trimmedKey,
            valid: false,
            error: 'Invalid format (should start with AIza)',
            maskedKey,
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(trimmedKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Minimal test call
        const result = await model.generateContent("Reply with only the word 'OK'");
        const text = result.response.text();

        if (text) {
            return {
                key: trimmedKey,
                valid: true,
                maskedKey,
            };
        }

        return {
            key: trimmedKey,
            valid: false,
            error: 'Empty response',
            maskedKey,
        };
    } catch (error: unknown) {
        const err = error as { status?: number; message?: string };

        // Rate limit means key is valid but quota exceeded
        if (err.status === 429) {
            return {
                key: trimmedKey,
                valid: true,
                error: 'Rate limited (key works)',
                maskedKey,
            };
        }

        // Forbidden means key is invalid/leaked
        if (err.status === 403) {
            const message = err.message || '';
            if (message.includes('leaked')) {
                return {
                    key: trimmedKey,
                    valid: false,
                    error: 'Key reported as leaked',
                    maskedKey,
                };
            }
            return {
                key: trimmedKey,
                valid: false,
                error: 'Access denied (invalid key)',
                maskedKey,
            };
        }

        // Unauthorized
        if (err.status === 401) {
            return {
                key: trimmedKey,
                valid: false,
                error: 'Unauthorized (invalid key)',
                maskedKey,
            };
        }

        return {
            key: trimmedKey,
            valid: false,
            error: err.message || 'Unknown error',
            maskedKey,
        };
    }
}

/**
 * Validate multiple keys concurrently (max 3 at a time)
 */
export async function validateMultipleKeys(keys: string[]): Promise<{
    valid: ValidationResult[];
    invalid: ValidationResult[];
}> {
    const uniqueKeys = [...new Set(keys.map(k => k.trim()).filter(k => k.length > 0))];

    const results: ValidationResult[] = [];
    const batchSize = 3;

    for (let i = 0; i < uniqueKeys.length; i += batchSize) {
        const batch = uniqueKeys.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(validateApiKey));
        results.push(...batchResults);

        // Small delay between batches
        if (i + batchSize < uniqueKeys.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return {
        valid: results.filter(r => r.valid),
        invalid: results.filter(r => !r.valid),
    };
}
