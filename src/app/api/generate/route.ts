// Videlix AI - Generate API Route

import { NextRequest, NextResponse } from 'next/server';
import { generate, getProfiles } from '@/lib/ai/generator';
import { PipelineStep, Language, VideoIdea, OutlineSection, ScriptContent } from '@/types';

// Rate limiting store (in-memory for MVP)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

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
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Check rate limit
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Rate limit exceeded. Please wait a moment before trying again.'
                },
                { status: 429 }
            );
        }

        // Parse request body
        const body = await request.json();
        const {
            step,
            profileId,
            language,
            topic,
            previousContent,
            modifier
        } = body as {
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
        };

        // Validate required fields
        if (!step || !profileId || !language || !topic) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: step, profileId, language, topic'
                },
                { status: 400 }
            );
        }

        // Validate step
        const validSteps: PipelineStep[] = ['idea', 'outline', 'script', 'metadata'];
        if (!validSteps.includes(step)) {
            return NextResponse.json(
                { success: false, error: 'Invalid step' },
                { status: 400 }
            );
        }

        // Validate language
        if (language !== 'en' && language !== 'vi') {
            return NextResponse.json(
                { success: false, error: 'Invalid language. Use "en" or "vi"' },
                { status: 400 }
            );
        }

        // Generate content
        const result = await generate({
            step,
            profileId,
            language,
            topic,
            previousContent,
            modifier,
        });

        return NextResponse.json({
            success: true,
            data: result,
        });

    } catch (error) {
        console.error('Generate API error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            {
                success: false,
                error: errorMessage
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Return available profiles
    try {
        const profilesList = getProfiles().map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            icon: p.icon,
            category: p.category,
        }));

        return NextResponse.json({
            success: true,
            profiles: profilesList,
        });
    } catch (error) {
        console.error('Get profiles error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load profiles' },
            { status: 500 }
        );
    }
}
