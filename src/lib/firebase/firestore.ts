// Videlix AI - Firestore Service (Primary Database)

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { BilingualText } from '@/types';

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
    createdAt: Timestamp;
    updatedAt: Timestamp;
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
    totalUsage: number;
    lastUsed: Timestamp;
    createdAt: Timestamp;
}

export interface ProfileVersion {
    version: number;
    content: Omit<FirebaseProfile, 'id'>;
    changedBy: string;
    changedAt: Timestamp;
    changeNote: string;
}

export interface AppSettings {
    rateLimits: {
        free: number;
        pro: number;
    };
    maintenance: boolean;
    announcement?: string;
}

// ==================== COLLECTIONS ====================

const COLLECTIONS = {
    profiles: 'profiles',
    users: 'users',
    profileVersions: 'profileVersions',
    settings: 'settings',
    analytics: 'analytics',
};

// ==================== PROFILES ====================

export async function getAllProfiles(): Promise<FirebaseProfile[]> {
    const profilesRef = collection(db, COLLECTIONS.profiles);
    const snapshot = await getDocs(profilesRef);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as FirebaseProfile));
}

export async function getActiveProfiles(): Promise<FirebaseProfile[]> {
    const profilesRef = collection(db, COLLECTIONS.profiles);
    const q = query(profilesRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as FirebaseProfile));
}

export async function getProfileById(id: string): Promise<FirebaseProfile | null> {
    const profileRef = doc(db, COLLECTIONS.profiles, id);
    const snapshot = await getDoc(profileRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as FirebaseProfile;
}

export async function createProfile(
    profile: Omit<FirebaseProfile, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<string> {
    const profilesRef = collection(db, COLLECTIONS.profiles);
    const newDocRef = doc(profilesRef);

    const profileData = {
        ...profile,
        version: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(newDocRef, profileData);
    return newDocRef.id;
}

export async function updateProfile(
    id: string,
    updates: Partial<FirebaseProfile>,
    changedBy: string = 'admin',
    changeNote: string = 'Updated'
): Promise<void> {
    const profileRef = doc(db, COLLECTIONS.profiles, id);

    // Get current version for history
    const currentSnapshot = await getDoc(profileRef);
    if (currentSnapshot.exists()) {
        const currentData = currentSnapshot.data() as FirebaseProfile;

        // Save version history
        await saveProfileVersion(id, {
            version: currentData.version || 1,
            content: currentData,
            changedBy,
            changedAt: Timestamp.now(),
            changeNote,
        });

        // Increment version
        updates.version = (currentData.version || 1) + 1;
    }

    await updateDoc(profileRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteProfile(id: string): Promise<void> {
    const profileRef = doc(db, COLLECTIONS.profiles, id);
    await deleteDoc(profileRef);
}

export async function toggleProfileActive(id: string, isActive: boolean): Promise<void> {
    await updateProfile(id, { isActive }, 'admin', isActive ? 'Activated' : 'Deactivated');
}

// ==================== VERSION HISTORY ====================

async function saveProfileVersion(profileId: string, version: ProfileVersion): Promise<void> {
    const versionRef = doc(
        db,
        COLLECTIONS.profileVersions,
        profileId,
        'versions',
        version.version.toString()
    );
    await setDoc(versionRef, version);
}

export async function getProfileVersions(profileId: string): Promise<ProfileVersion[]> {
    const versionsRef = collection(db, COLLECTIONS.profileVersions, profileId, 'versions');
    const q = query(versionsRef, orderBy('version', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data() as ProfileVersion);
}

export async function rollbackProfile(profileId: string, toVersion: number): Promise<void> {
    const versions = await getProfileVersions(profileId);
    const targetVersion = versions.find(v => v.version === toVersion);

    if (!targetVersion) {
        throw new Error(`Version ${toVersion} not found`);
    }

    await updateProfile(profileId, targetVersion.content, 'admin', `Rollback to v${toVersion}`);
}

// ==================== USERS ====================

export async function getAllUsers(): Promise<FirebaseUser[]> {
    const usersRef = collection(db, COLLECTIONS.users);
    const q = query(usersRef, orderBy('lastUsed', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as FirebaseUser));
}

export async function getUserById(id: string): Promise<FirebaseUser | null> {
    const userRef = doc(db, COLLECTIONS.users, id);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as FirebaseUser;
}

export async function createOrUpdateUser(id: string, userData: Partial<FirebaseUser>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.users, id);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        // Create new user
        await setDoc(userRef, {
            ...userData,
            role: userData.role || 'user',
            tier: userData.tier || 'free',
            totalUsage: 0,
            createdAt: serverTimestamp(),
            lastUsed: serverTimestamp(),
        });
    } else {
        // Update existing
        await updateDoc(userRef, {
            ...userData,
            lastUsed: serverTimestamp(),
        });
    }
}

export async function updateUserTier(id: string, tier: 'free' | 'pro'): Promise<void> {
    const userRef = doc(db, COLLECTIONS.users, id);
    await updateDoc(userRef, { tier });
}

export async function updateUserRole(id: string, role: 'admin' | 'user'): Promise<void> {
    const userRef = doc(db, COLLECTIONS.users, id);
    await updateDoc(userRef, { role });
}

export async function incrementUserUsage(id: string): Promise<void> {
    const user = await getUserById(id);
    if (user) {
        const userRef = doc(db, COLLECTIONS.users, id);
        await updateDoc(userRef, {
            totalUsage: (user.totalUsage || 0) + 1,
            lastUsed: serverTimestamp(),
        });
    }
}

// ==================== SETTINGS ====================

export async function getSettings(): Promise<AppSettings> {
    const settingsRef = doc(db, COLLECTIONS.settings, 'app');
    const snapshot = await getDoc(settingsRef);

    if (!snapshot.exists()) {
        return {
            rateLimits: { free: 3, pro: -1 },
            maintenance: false,
        };
    }

    return snapshot.data() as AppSettings;
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const settingsRef = doc(db, COLLECTIONS.settings, 'app');
    await setDoc(settingsRef, settings, { merge: true });
}

// ==================== ANALYTICS ====================

export async function getAnalyticsSummary(): Promise<{
    totalProfiles: number;
    totalUsers: number;
    activeProfiles: number;
    proUsers: number;
}> {
    const [profiles, users] = await Promise.all([
        getAllProfiles(),
        getAllUsers(),
    ]);

    return {
        totalProfiles: profiles.length,
        totalUsers: users.length,
        activeProfiles: profiles.filter(p => p.isActive).length,
        proUsers: users.filter(u => u.tier === 'pro').length,
    };
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

export function subscribeToProfiles(callback: (profiles: FirebaseProfile[]) => void): () => void {
    const profilesRef = collection(db, COLLECTIONS.profiles);

    return onSnapshot(profilesRef, (snapshot) => {
        const profiles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as FirebaseProfile));
        callback(profiles);
    });
}

export function subscribeToUsers(callback: (users: FirebaseUser[]) => void): () => void {
    const usersRef = collection(db, COLLECTIONS.users);

    return onSnapshot(usersRef, (snapshot) => {
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as FirebaseUser));
        callback(users);
    });
}

// ==================== BATCH OPERATIONS ====================

export async function batchCreateProfiles(
    profiles: Omit<FirebaseProfile, 'id' | 'createdAt' | 'updatedAt' | 'version'>[]
): Promise<string[]> {
    const batch = writeBatch(db);
    const ids: string[] = [];

    for (const profile of profiles) {
        const newDocRef = doc(collection(db, COLLECTIONS.profiles));
        ids.push(newDocRef.id);

        batch.set(newDocRef, {
            ...profile,
            version: 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }

    await batch.commit();
    return ids;
}
