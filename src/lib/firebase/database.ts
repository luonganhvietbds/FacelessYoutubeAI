// Videlix AI - Firebase Database Service

import {
    ref,
    get,
    set,
    update,
    remove,
    push,
    onValue,
    query,
    orderByChild,
    DataSnapshot
} from 'firebase/database';
import { database } from './config';
import { PromptProfile, BilingualText } from '@/types';

// ==================== TYPES ====================

export interface FirebaseProfile {
    id: string;
    name: BilingualText;
    description: BilingualText;
    icon: string;
    category: string;
    isActive: boolean;
    isPremium: boolean;
    version: number;
    createdAt: number;
    updatedAt: number;
    prompts: {
        idea: BilingualText;
        outline: BilingualText;
        script: BilingualText;
        metadata: BilingualText;
    };
}

export interface FirebaseUser {
    id: string;
    email: string;
    displayName?: string;
    role: 'admin' | 'user';
    tier: 'free' | 'pro';
    usageToday: number;
    totalUsage: number;
    lastUsed: number;
    createdAt: number;
}

export interface ProfileVersion {
    version: number;
    content: FirebaseProfile;
    changedBy: string;
    changedAt: number;
    changeNote: string;
}

// ==================== PROFILES ====================

const PROFILES_PATH = 'profiles';
const VERSIONS_PATH = 'profileVersions';

export async function getAllProfiles(): Promise<FirebaseProfile[]> {
    const profilesRef = ref(database, PROFILES_PATH);
    const snapshot = await get(profilesRef);

    if (!snapshot.exists()) {
        return [];
    }

    const data = snapshot.val();
    return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
    }));
}

export async function getActiveProfiles(): Promise<FirebaseProfile[]> {
    const profiles = await getAllProfiles();
    return profiles.filter(p => p.isActive);
}

export async function getProfileById(id: string): Promise<FirebaseProfile | null> {
    const profileRef = ref(database, `${PROFILES_PATH}/${id}`);
    const snapshot = await get(profileRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id, ...snapshot.val() };
}

export async function createProfile(profile: Omit<FirebaseProfile, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<string> {
    const profilesRef = ref(database, PROFILES_PATH);
    const newProfileRef = push(profilesRef);

    const now = Date.now();
    const profileData = {
        ...profile,
        version: 1,
        createdAt: now,
        updatedAt: now,
    };

    await set(newProfileRef, profileData);
    return newProfileRef.key!;
}

export async function updateProfile(
    id: string,
    updates: Partial<FirebaseProfile>,
    changedBy: string = 'admin',
    changeNote: string = 'Updated'
): Promise<void> {
    const profileRef = ref(database, `${PROFILES_PATH}/${id}`);

    // Get current version for history
    const currentSnapshot = await get(profileRef);
    if (currentSnapshot.exists()) {
        const currentData = currentSnapshot.val();

        // Save version history
        await saveProfileVersion(id, {
            version: currentData.version || 1,
            content: { id, ...currentData },
            changedBy,
            changedAt: Date.now(),
            changeNote,
        });

        // Increment version
        updates.version = (currentData.version || 1) + 1;
    }

    updates.updatedAt = Date.now();
    await update(profileRef, updates);
}

export async function deleteProfile(id: string): Promise<void> {
    const profileRef = ref(database, `${PROFILES_PATH}/${id}`);
    await remove(profileRef);
}

export async function toggleProfileActive(id: string, isActive: boolean): Promise<void> {
    await updateProfile(id, { isActive }, 'admin', isActive ? 'Activated' : 'Deactivated');
}

// ==================== VERSION HISTORY ====================

async function saveProfileVersion(profileId: string, version: ProfileVersion): Promise<void> {
    const versionRef = ref(database, `${VERSIONS_PATH}/${profileId}/${version.version}`);
    await set(versionRef, version);
}

export async function getProfileVersions(profileId: string): Promise<ProfileVersion[]> {
    const versionsRef = ref(database, `${VERSIONS_PATH}/${profileId}`);
    const snapshot = await get(versionsRef);

    if (!snapshot.exists()) {
        return [];
    }

    const data = snapshot.val();
    return Object.values(data);
}

export async function rollbackProfile(profileId: string, toVersion: number): Promise<void> {
    const versions = await getProfileVersions(profileId);
    const targetVersion = versions.find(v => v.version === toVersion);

    if (!targetVersion) {
        throw new Error(`Version ${toVersion} not found`);
    }

    const { id, ...profileData } = targetVersion.content;
    await updateProfile(profileId, profileData, 'admin', `Rollback to v${toVersion}`);
}

// ==================== USERS ====================

const USERS_PATH = 'users';

export async function getAllUsers(): Promise<FirebaseUser[]> {
    const usersRef = ref(database, USERS_PATH);
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
        return [];
    }

    const data = snapshot.val();
    return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
    }));
}

export async function getUserById(id: string): Promise<FirebaseUser | null> {
    const userRef = ref(database, `${USERS_PATH}/${id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id, ...snapshot.val() };
}

export async function createOrUpdateUser(id: string, userData: Partial<FirebaseUser>): Promise<void> {
    const userRef = ref(database, `${USERS_PATH}/${id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
        // Create new user
        await set(userRef, {
            ...userData,
            role: userData.role || 'user',
            tier: userData.tier || 'free',
            usageToday: 0,
            totalUsage: 0,
            createdAt: Date.now(),
            lastUsed: Date.now(),
        });
    } else {
        // Update existing
        await update(userRef, {
            ...userData,
            lastUsed: Date.now(),
        });
    }
}

export async function updateUserTier(id: string, tier: 'free' | 'pro'): Promise<void> {
    const userRef = ref(database, `${USERS_PATH}/${id}`);
    await update(userRef, { tier });
}

export async function updateUserRole(id: string, role: 'admin' | 'user'): Promise<void> {
    const userRef = ref(database, `${USERS_PATH}/${id}`);
    await update(userRef, { role });
}

export async function incrementUserUsage(id: string): Promise<void> {
    const user = await getUserById(id);
    if (user) {
        const userRef = ref(database, `${USERS_PATH}/${id}`);
        await update(userRef, {
            usageToday: (user.usageToday || 0) + 1,
            totalUsage: (user.totalUsage || 0) + 1,
            lastUsed: Date.now(),
        });
    }
}

// ==================== ANALYTICS ====================

const ANALYTICS_PATH = 'analytics';

export async function trackProfileUsage(profileId: string): Promise<void> {
    const usageRef = ref(database, `${ANALYTICS_PATH}/profileUsage/${profileId}`);
    const snapshot = await get(usageRef);
    const currentCount = snapshot.exists() ? snapshot.val() : 0;
    await set(usageRef, currentCount + 1);
}

export async function getProfileUsageStats(): Promise<Record<string, number>> {
    const usageRef = ref(database, `${ANALYTICS_PATH}/profileUsage`);
    const snapshot = await get(usageRef);
    return snapshot.exists() ? snapshot.val() : {};
}

export async function trackDailyStats(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = ref(database, `${ANALYTICS_PATH}/dailyStats/${today}`);
    const snapshot = await get(statsRef);

    const current = snapshot.exists() ? snapshot.val() : { generations: 0, uniqueUsers: 0 };
    await set(statsRef, {
        generations: current.generations + 1,
        uniqueUsers: current.uniqueUsers,
    });
}

// ==================== SETTINGS ====================

const SETTINGS_PATH = 'settings';

export interface AppSettings {
    rateLimits: {
        free: number;
        pro: number;
    };
    maintenance: boolean;
    announcement?: string;
}

export async function getSettings(): Promise<AppSettings> {
    const settingsRef = ref(database, SETTINGS_PATH);
    const snapshot = await get(settingsRef);

    if (!snapshot.exists()) {
        return {
            rateLimits: { free: 3, pro: -1 },
            maintenance: false,
        };
    }

    return snapshot.val();
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const settingsRef = ref(database, SETTINGS_PATH);
    await update(settingsRef, settings);
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

export function subscribeToProfiles(callback: (profiles: FirebaseProfile[]) => void): () => void {
    const profilesRef = ref(database, PROFILES_PATH);

    const unsubscribe = onValue(profilesRef, (snapshot) => {
        if (!snapshot.exists()) {
            callback([]);
            return;
        }

        const data = snapshot.val();
        const profiles = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
        callback(profiles);
    });

    return unsubscribe;
}

export function subscribeToUsers(callback: (users: FirebaseUser[]) => void): () => void {
    const usersRef = ref(database, USERS_PATH);

    const unsubscribe = onValue(usersRef, (snapshot) => {
        if (!snapshot.exists()) {
            callback([]);
            return;
        }

        const data = snapshot.val();
        const users = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
        callback(users);
    });

    return unsubscribe;
}
