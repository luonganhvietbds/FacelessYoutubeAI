// Videlix AI - Gemini Service
// Calls Gemini AI directly with user-provided API key

import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash';

export interface GeminiRequest {
    systemPrompt: string;
    userPrompt: string;
    apiKey: string;
}

/**
 * Call Gemini AI with user's API key
 */
export async function callGemini<T>(request: GeminiRequest): Promise<T> {
    const { systemPrompt, userPrompt, apiKey } = request;

    if (!apiKey) {
        throw new Error('API Key is required. Please enter your Gemini API Key.');
    }

    console.log(`🤖 Calling Gemini with model: ${MODEL_NAME}`);
    console.log(`🔑 Using API key: ...${apiKey.slice(-8)}`);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                temperature: 0.8,
                topP: 0.95,
                maxOutputTokens: 65536,
                responseMimeType: 'application/json',
            },
        });

        const result = await model.generateContent([
            { text: `System: ${systemPrompt}` },
            { text: `User: ${userPrompt}` },
        ]);

        const response = result.response;
        const text = response.text();

        console.log('✅ Gemini response received');

        // Parse JSON response
        const parsed = parseJsonResponse<T>(text);
        return parsed;

    } catch (error) {
        console.error('❌ Gemini API error:', error);

        if (error instanceof Error) {
            if (error.message.includes('API_KEY_INVALID')) {
                throw new Error('Invalid API Key. Please check your Gemini API Key.');
            }
            if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429')) {
                throw new Error('API quota exceeded. Please wait a moment or use a different key.');
            }
            throw error;
        }

        throw new Error('Failed to call Gemini API');
    }
}

/**
 * Parse JSON response with repair
 */
function parseJsonResponse<T>(text: string): T {
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

    // Try to parse
    try {
        return JSON.parse(cleanText) as T;
    } catch (firstError) {
        console.log('First parse failed, attempting repair...');

        // Repair common JSON issues
        let repaired = cleanText;
        repaired = repaired.replace(/(\")\\s*\\n\\s*(\")/g, '$1,\n$2');
        repaired = repaired.replace(/}\\s*\\n\\s*{/g, '},\n{');
        repaired = repaired.replace(/,\\s*([}\\]])/g, '$1');

        try {
            return JSON.parse(repaired) as T;
        } catch (secondError) {
            console.error('JSON parse failed:', cleanText.slice(0, 200));
            throw new Error('Failed to parse AI response as JSON');
        }
    }
}
