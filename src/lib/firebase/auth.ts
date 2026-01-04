// Videlix AI - Firebase Auth Service for Admin

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { auth } from './config';
import { getUserById, createOrUpdateUser } from './firestore';

export interface AdminUser {
    uid: string;
    email: string;
    displayName: string | null;
    isAdmin: boolean;
}

// Sign in with email/password
export async function signIn(email: string, password: string): Promise<AdminUser> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Check if user exists in Firestore, create if not
    let dbUser = await getUserById(user.uid);

    if (!dbUser) {
        // Create user record in Firestore
        await createOrUpdateUser(user.uid, {
            email: user.email || '',
            displayName: user.displayName || '',
            role: 'user', // Default role
            tier: 'free',
        });
        dbUser = await getUserById(user.uid);
    }

    const isAdmin = dbUser?.role === 'admin';

    if (!isAdmin) {
        await signOut(auth);
        throw new Error('Access denied. Admin privileges required.');
    }

    return {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName,
        isAdmin: true,
    };
}

// Sign out
export async function logOut(): Promise<void> {
    await signOut(auth);
}

// Get current user
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

// Subscribe to auth state
export function subscribeToAuthState(callback: (user: AdminUser | null) => void): () => void {
    return onAuthStateChanged(auth, async (user) => {
        if (!user) {
            callback(null);
            return;
        }

        const dbUser = await getUserById(user.uid);
        const isAdmin = dbUser?.role === 'admin';

        callback({
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName,
            isAdmin,
        });
    });
}

// Check if current user is admin
export async function isCurrentUserAdmin(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    const dbUser = await getUserById(user.uid);
    return dbUser?.role === 'admin';
}
