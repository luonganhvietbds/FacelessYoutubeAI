// Videlix AI - Database Seed API Route

import { NextRequest, NextResponse } from 'next/server';
import {
    collection,
    doc,
    setDoc,
    getDocs,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import localProfiles from '@/lib/prompts/profiles.json';

// Initial settings
const DEFAULT_SETTINGS = {
    rateLimits: { free: 3, pro: -1 },
    maintenance: false,
    announcement: '',
};

// Initial admin user (you'll need to create this in Firebase Auth first)
const INITIAL_ADMIN = {
    email: 'admin@videlix.ai',
    displayName: 'Admin',
    role: 'admin' as const,
    tier: 'pro' as const,
    totalUsage: 0,
};

export async function POST(request: NextRequest) {
    try {
        const batch = writeBatch(db);
        const results = {
            profiles: 0,
            settings: false,
            success: true,
            message: '',
        };

        // 1. Check if data already exists
        const profilesRef = collection(db, 'profiles');
        const existingProfiles = await getDocs(profilesRef);

        if (existingProfiles.size > 0) {
            return NextResponse.json({
                success: false,
                message: `Database already has ${existingProfiles.size} profiles. Use admin panel to manage data.`,
                existingData: {
                    profiles: existingProfiles.size,
                }
            });
        }

        // 2. Seed Profiles
        for (const profile of localProfiles.profiles) {
            const profileRef = doc(collection(db, 'profiles'));

            batch.set(profileRef, {
                name: profile.name,
                description: profile.description,
                icon: profile.icon,
                category: profile.category,
                isActive: true,
                isPremium: false,
                version: 1,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                prompts: profile.prompts,
            });

            results.profiles++;
        }

        // 3. Seed Default Settings
        const settingsRef = doc(db, 'settings', 'app');
        batch.set(settingsRef, DEFAULT_SETTINGS);
        results.settings = true;

        // 4. Commit all changes
        await batch.commit();

        results.message = `Successfully seeded database with ${results.profiles} profiles and default settings.`;

        return NextResponse.json({
            success: true,
            profiles: results.profiles,
            settings: results.settings,
            message: results.message,
        });

    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Check current database status
        const [profilesSnap, settingsSnap, usersSnap] = await Promise.all([
            getDocs(collection(db, 'profiles')),
            getDocs(collection(db, 'settings')),
            getDocs(collection(db, 'users')),
        ]);

        const profiles = profilesSnap.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            isActive: doc.data().isActive,
        }));

        return NextResponse.json({
            success: true,
            status: {
                profiles: profilesSnap.size,
                settings: settingsSnap.size,
                users: usersSnap.size,
                isEmpty: profilesSnap.size === 0,
            },
            profiles,
            message: profilesSnap.size === 0
                ? 'Database is empty. Send POST request to seed initial data.'
                : 'Database has existing data.',
        });

    } catch (error) {
        console.error('Status check error:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
