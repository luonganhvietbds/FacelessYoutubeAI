// Videlix AI - Generate Service
// Handles API calls to generate endpoint with user API keys

import { getActiveUserApiKeys } from '@/lib/api-keys/keyStore';

interface GenerateRequest {
    step: 'idea' | 'outline' | 'script' | 'metadata';
    profileId: string;
    language: 'en' | 'vi';
    topic: string;
    previousContent?: {
        selectedIdea?: unknown;
        outline?: unknown;
        script?: unknown;
    };
    modifier?: string;
}

interface GenerateResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
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

        if (userId) {
            try {
                userApiKeys = await getActiveUserApiKeys(userId);
                console.log(`📦 Using ${userApiKeys.length} user API keys`);
            } catch (error) {
                console.warn('Failed to get user API keys:', error);
            }
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
