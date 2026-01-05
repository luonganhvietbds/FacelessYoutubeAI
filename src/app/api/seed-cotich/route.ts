// Videlix AI - Add Cổ Tích Ngược Profile API Route

import { NextRequest, NextResponse } from 'next/server';
import { createProfile, getAllProfiles } from '@/lib/firebase/firestore';
import { coTichNguocProfile } from '@/lib/profiles/coTichNguoc';

export async function POST(request: NextRequest) {
    try {
        // Check if profile already exists
        const existingProfiles = await getAllProfiles();
        const exists = existingProfiles.some(
            p => p.name.en === coTichNguocProfile.name.en ||
                p.name.vi === coTichNguocProfile.name.vi
        );

        if (exists) {
            return NextResponse.json({
                success: false,
                message: 'Profile "Cổ Tích Ngược" already exists in database.',
            });
        }

        // Create the profile
        const profileId = await createProfile(coTichNguocProfile);

        return NextResponse.json({
            success: true,
            profileId,
            message: 'Profile "Cổ Tích Ngược" added successfully!',
            profile: {
                id: profileId,
                name: coTichNguocProfile.name,
                category: coTichNguocProfile.category,
            }
        });

    } catch (error) {
        console.error('Add profile error:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Send POST request to add "Cổ Tích Ngược" profile to database.',
        profile: {
            name: coTichNguocProfile.name,
            description: coTichNguocProfile.description,
            category: coTichNguocProfile.category,
            isPremium: coTichNguocProfile.isPremium,
        }
    });
}
