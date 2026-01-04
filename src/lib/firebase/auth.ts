// Videlix AI - Enhanced Firebase Auth Service
// Firebase Web SDK v10 modular imports

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile,
    User,
    UserCredential
} from 'firebase/auth';
import { auth } from './config';
import { getUserById, createOrUpdateUser } from './firestore';
import { getAuthErrorMessage, isEmailExistsError } from './authErrors';

// ==================== TYPES ====================

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    isAdmin: boolean;
}

export interface AuthResult {
    success: boolean;
    user?: AuthUser;
    error?: string;
    requiresVerification?: boolean;
    emailExists?: boolean;
}

// ==================== SIGN IN ====================

/**
 * Sign in with email and password
 * Checks email verification status
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        // Check if email is verified
        if (!user.emailVerified) {
            // Sign out - don't allow unverified users
            await signOut(auth);
            return {
                success: false,
                requiresVerification: true,
                error: 'Please verify your email before signing in',
            };
        }

        // Get user role from Firestore
        const dbUser = await getUserById(user.uid);
        const isAdmin = dbUser?.role === 'admin';

        // Update last login
        await createOrUpdateUser(user.uid, {
            email: user.email || '',
            displayName: user.displayName || '',
        });

        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
                isAdmin,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: getAuthErrorMessage(error),
        };
    }
}

// ==================== SIGN UP ====================

/**
 * Create new user with email and password
 * Sends verification email, does NOT auto-login
 */
export async function signUp(
    email: string,
    password: string,
    displayName: string
): Promise<AuthResult> {
    try {
        // Create user
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        // Update profile with display name
        await updateProfile(user, { displayName });

        // Create user record in Firestore
        await createOrUpdateUser(user.uid, {
            email: user.email || '',
            displayName,
            role: 'user',
            tier: 'free',
        });

        // Send verification email
        await sendEmailVerification(user);

        // Sign out - don't auto-login unverified users
        await signOut(auth);

        return {
            success: true,
            requiresVerification: true,
        };
    } catch (error) {
        return {
            success: false,
            error: getAuthErrorMessage(error),
            emailExists: isEmailExistsError(error),
        };
    }
}

// ==================== EMAIL VERIFICATION ====================

/**
 * Resend verification email to current user
 */
export async function resendVerificationEmail(user: User): Promise<AuthResult> {
    try {
        await sendEmailVerification(user);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: getAuthErrorMessage(error),
        };
    }
}

/**
 * Check if current user's email is verified
 */
export function isEmailVerified(): boolean {
    return auth.currentUser?.emailVerified || false;
}

/**
 * Reload user to get latest verification status
 */
export async function reloadUser(): Promise<boolean> {
    if (auth.currentUser) {
        await auth.currentUser.reload();
        return auth.currentUser.emailVerified;
    }
    return false;
}

// ==================== PASSWORD RESET ====================

/**
 * Send password reset email
 * Always returns success for security (don't reveal if email exists)
 */
export async function resetPassword(email: string): Promise<AuthResult> {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        // For security, don't reveal if email exists or not
        // Just show success message
        console.error('Password reset error:', error);
        return { success: true };
    }
}

// ==================== SIGN OUT ====================

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
    await signOut(auth);
}

// ==================== AUTH STATE ====================

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 * Includes verification and admin check
 */
export function subscribeToAuthState(
    callback: (user: AuthUser | null) => void
): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
            callback(null);
            return;
        }

        // Get user role from Firestore
        const dbUser = await getUserById(firebaseUser.uid);
        const isAdmin = dbUser?.role === 'admin';

        callback({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            isAdmin,
        });
    });
}

/**
 * Subscribe to auth state with verification requirement
 * Returns null for unverified users
 */
export function subscribeToVerifiedAuth(
    callback: (user: AuthUser | null, requiresVerification: boolean) => void
): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
            callback(null, false);
            return;
        }

        // Check verification
        if (!firebaseUser.emailVerified) {
            callback(null, true);
            return;
        }

        // Get user role from Firestore
        const dbUser = await getUserById(firebaseUser.uid);
        const isAdmin = dbUser?.role === 'admin';

        callback({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            isAdmin,
        }, false);
    });
}

// ==================== ADMIN CHECK ====================

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user || !user.emailVerified) return false;

    const dbUser = await getUserById(user.uid);
    return dbUser?.role === 'admin';
}
