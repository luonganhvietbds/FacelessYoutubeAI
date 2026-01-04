// Videlix AI - useAuth Hook
// React hook for managing authentication state

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    AuthUser,
    subscribeToAuthState,
    signIn as firebaseSignIn,
    signUp as firebaseSignUp,
    logOut as firebaseLogOut,
    resetPassword as firebaseResetPassword,
    resendVerificationEmail,
    getCurrentUser,
    AuthResult
} from '@/lib/firebase/auth';

interface UseAuthReturn {
    user: AuthUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<AuthResult>;
    signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<AuthResult>;
    resendVerification: () => Promise<AuthResult>;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAuthState((authUser) => {
            setUser(authUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        return firebaseSignIn(email, password);
    }, []);

    const signUp = useCallback(async (email: string, password: string, displayName: string) => {
        return firebaseSignUp(email, password, displayName);
    }, []);

    const signOut = useCallback(async () => {
        await firebaseLogOut();
        setUser(null);
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        return firebaseResetPassword(email);
    }, []);

    const resendVerification = useCallback(async () => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'No user logged in' };
        }
        return resendVerificationEmail(currentUser);
    }, []);

    return {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        resendVerification,
    };
}
