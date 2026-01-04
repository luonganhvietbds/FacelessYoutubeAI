// Videlix AI - API Key Validation Endpoint
// POST: Validate one or more API keys

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, validateMultipleKeys, ValidationResult } from '@/lib/api-keys/validator';

// Rate limiting (simple in-memory for MVP)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // validations per minute
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
        return true;
    }

    if (record.count >= RATE_LIMIT) {
        return false;
    }

    record.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { success: false, error: 'Rate limit exceeded. Try again in a minute.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { keys } = body as { keys?: string[] };

        if (!keys || !Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Please provide an array of API keys' },
                { status: 400 }
            );
        }

        // Limit number of keys per request
        if (keys.length > 10) {
            return NextResponse.json(
                { success: false, error: 'Maximum 10 keys per request' },
                { status: 400 }
            );
        }

        // Validate keys
        const results = await validateMultipleKeys(keys);

        return NextResponse.json({
            success: true,
            valid: results.valid,
            invalid: results.invalid,
            summary: {
                total: keys.length,
                valid: results.valid.length,
                invalid: results.invalid.length,
            },
        });

    } catch (error) {
        console.error('Validate key API error:', error);
        return NextResponse.json(
            { success: false, error: 'Validation failed' },
            { status: 500 }
        );
    }
}
