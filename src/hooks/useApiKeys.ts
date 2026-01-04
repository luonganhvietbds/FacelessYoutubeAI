'use client';

// Videlix AI - API Keys Hook
// Manages user's API keys with real-time sync

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    subscribeToUserApiKeys,
    addUserApiKey,
    deleteUserApiKey,
    updateApiKeyStatus,
    ApiKeyDisplay,
} from '@/lib/api-keys/keyStore';
import { validateApiKey, ValidationResult } from '@/lib/api-keys/validator';

interface UseApiKeysReturn {
    keys: ApiKeyDisplay[];
    loading: boolean;
    validating: boolean;
    addKeys: (keysText: string) => Promise<{ valid: number; invalid: number }>;
    deleteKey: (keyId: string) => Promise<void>;
    revalidateKey: (keyId: string) => Promise<void>;
    hasActiveKeys: boolean;
}

export function useApiKeys(): UseApiKeysReturn {
    const { user } = useAuth();
    const [keys, setKeys] = useState<ApiKeyDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);

    // Subscribe to user's keys
    useEffect(() => {
        if (!user) {
            setKeys([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToUserApiKeys(user.uid, (userKeys) => {
            setKeys(userKeys);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Add multiple keys from text (one per line)
    const addKeys = useCallback(async (keysText: string): Promise<{ valid: number; invalid: number }> => {
        if (!user) {
            throw new Error('Must be logged in to add keys');
        }

        setValidating(true);

        try {
            const keyLines = keysText
                .split('\n')
                .map(k => k.trim())
                .filter(k => k.length > 0 && k.startsWith('AIza'));

            let validCount = 0;
            let invalidCount = 0;

            // Validate and add each key
            for (const key of keyLines) {
                const result = await validateApiKey(key);

                await addUserApiKey(
                    user.uid,
                    key,
                    result.valid ? 'active' : 'invalid',
                    result.error
                );

                if (result.valid) {
                    validCount++;
                } else {
                    invalidCount++;
                }
            }

            return { valid: validCount, invalid: invalidCount };
        } finally {
            setValidating(false);
        }
    }, [user]);

    // Delete a key
    const deleteKey = useCallback(async (keyId: string): Promise<void> => {
        if (!user) return;
        await deleteUserApiKey(user.uid, keyId);
    }, [user]);

    // Re-validate a specific key
    const revalidateKey = useCallback(async (keyId: string): Promise<void> => {
        if (!user) return;

        // Find the key
        const keyData = keys.find(k => k.id === keyId);
        if (!keyData) return;

        // Mark as checking
        await updateApiKeyStatus(user.uid, keyId, 'checking');

        // This will trigger a full re-validation on the server
        // For now, we just update the status - full revalidation would need the actual key
        // which we don't store in the display object for security
    }, [user, keys]);

    return {
        keys,
        loading,
        validating,
        addKeys,
        deleteKey,
        revalidateKey,
        hasActiveKeys: keys.some(k => k.status === 'active'),
    };
}
