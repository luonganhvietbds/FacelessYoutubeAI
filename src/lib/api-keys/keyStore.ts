// Videlix AI - Firestore API Key Storage
// Manages user API keys in Firestore

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { hashApiKey, maskApiKey } from './validator';

// ==================== TYPES ====================

export interface UserApiKey {
    id: string;
    key: string;              // Full key (server-only access)
    keyHash: string;          // For deduplication
    maskedKey: string;        // Display version
    status: 'active' | 'invalid' | 'checking';
    errorMessage?: string;
    lastChecked: Timestamp;
    lastUsed?: Timestamp;
    usageCount: number;
    createdAt: Timestamp;
}

export interface ApiKeyDisplay {
    id: string;
    maskedKey: string;
    status: 'active' | 'invalid' | 'checking';
    errorMessage?: string;
    usageCount: number;
    lastUsed?: Date;
    createdAt: Date;
}

// ==================== CONSTANTS ====================

const COLLECTION = 'userApiKeys';

// ==================== FUNCTIONS ====================

/**
 * Get all API keys for a user
 */
export async function getUserApiKeys(userId: string): Promise<UserApiKey[]> {
    const keysRef = collection(db, COLLECTION, userId, 'keys');
    const q = query(keysRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as UserApiKey));
}

/**
 * Get only active API keys for a user (for use in generator)
 */
export async function getActiveUserApiKeys(userId: string): Promise<string[]> {
    const keysRef = collection(db, COLLECTION, userId, 'keys');
    const q = query(keysRef, where('status', '==', 'active'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data().key as string);
}

/**
 * Subscribe to user's API keys (real-time)
 */
export function subscribeToUserApiKeys(
    userId: string,
    callback: (keys: ApiKeyDisplay[]) => void
): () => void {
    const keysRef = collection(db, COLLECTION, userId, 'keys');
    const q = query(keysRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const keys = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                maskedKey: data.maskedKey,
                status: data.status,
                errorMessage: data.errorMessage,
                usageCount: data.usageCount || 0,
                lastUsed: data.lastUsed?.toDate(),
                createdAt: data.createdAt?.toDate() || new Date(),
            } as ApiKeyDisplay;
        });
        callback(keys);
    });
}

/**
 * Add a new API key for a user
 */
export async function addUserApiKey(
    userId: string,
    key: string,
    status: 'active' | 'invalid' = 'active',
    errorMessage?: string
): Promise<string> {
    const keyHash = hashApiKey(key);
    const maskedKey = maskApiKey(key);

    // Check for duplicate
    const existingKeys = await getUserApiKeys(userId);
    const duplicate = existingKeys.find(k => k.keyHash === keyHash);

    if (duplicate) {
        // Update existing key status
        await updateApiKeyStatus(userId, duplicate.id, status, errorMessage);
        return duplicate.id;
    }

    // Create new key document - use null instead of undefined for Firestore
    const keysRef = collection(db, COLLECTION, userId, 'keys');
    const newDocRef = doc(keysRef);

    const keyData = {
        key,
        keyHash,
        maskedKey,
        status,
        errorMessage: errorMessage || null, // Firestore doesn't accept undefined
        lastChecked: Timestamp.now(),
        usageCount: 0,
        createdAt: Timestamp.now(),
    };

    await setDoc(newDocRef, keyData);
    return newDocRef.id;
}

/**
 * Update API key status
 */
export async function updateApiKeyStatus(
    userId: string,
    keyId: string,
    status: 'active' | 'invalid' | 'checking',
    errorMessage?: string
): Promise<void> {
    const keyRef = doc(db, COLLECTION, userId, 'keys', keyId);
    await updateDoc(keyRef, {
        status,
        errorMessage: errorMessage || null,
        lastChecked: serverTimestamp(),
    });
}

/**
 * Delete an API key
 */
export async function deleteUserApiKey(userId: string, keyId: string): Promise<void> {
    const keyRef = doc(db, COLLECTION, userId, 'keys', keyId);
    await deleteDoc(keyRef);
}

/**
 * Increment usage count for a key
 */
export async function incrementKeyUsage(userId: string, keyId: string): Promise<void> {
    const keyRef = doc(db, COLLECTION, userId, 'keys', keyId);
    const snapshot = await getDoc(keyRef);

    if (snapshot.exists()) {
        const currentCount = snapshot.data().usageCount || 0;
        await updateDoc(keyRef, {
            usageCount: currentCount + 1,
            lastUsed: serverTimestamp(),
        });
    }
}

/**
 * Check if user has any active API keys
 */
export async function hasActiveApiKeys(userId: string): Promise<boolean> {
    const keys = await getActiveUserApiKeys(userId);
    return keys.length > 0;
}
