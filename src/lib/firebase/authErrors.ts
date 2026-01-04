// Videlix AI - Firebase Auth Error Handler
// Maps Firebase error codes to user-friendly messages

// NEVER expose raw Firebase error messages to users
const AUTH_ERROR_MESSAGES: Record<string, string> = {
    // Login errors - Always generic for security
    'auth/wrong-password': 'Email or Password Incorrect',
    'auth/user-not-found': 'Email or Password Incorrect',
    'auth/invalid-email': 'Email or Password Incorrect',
    'auth/invalid-credential': 'Email or Password Incorrect',
    'auth/invalid-login-credentials': 'Email or Password Incorrect',
    'auth/user-disabled': 'This account has been disabled',

    // Registration errors
    'auth/email-already-in-use': 'User already exists. Sign in?',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/operation-not-allowed': 'Registration is currently disabled',

    // Rate limiting
    'auth/too-many-requests': 'Too many attempts. Please try again later',

    // Network errors
    'auth/network-request-failed': 'Network error. Please check your connection',

    // Email verification
    'auth/missing-email': 'Please enter your email address',

    // Password reset
    'auth/expired-action-code': 'This link has expired. Please request a new one',
    'auth/invalid-action-code': 'Invalid link. Please request a new one',

    // Generic
    'auth/internal-error': 'Something went wrong. Please try again',
};

/**
 * Convert Firebase auth error code to user-friendly message
 * @param error - Firebase error object or error code string
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(error: unknown): string {
    // Extract error code from Firebase error
    let errorCode = '';

    if (typeof error === 'string') {
        errorCode = error;
    } else if (error && typeof error === 'object') {
        const firebaseError = error as { code?: string; message?: string };
        errorCode = firebaseError.code || '';
    }

    // Return mapped message or generic fallback
    return AUTH_ERROR_MESSAGES[errorCode] || 'Something went wrong. Please try again';
}

/**
 * Check if error indicates email already exists
 */
export function isEmailExistsError(error: unknown): boolean {
    if (error && typeof error === 'object') {
        const firebaseError = error as { code?: string };
        return firebaseError.code === 'auth/email-already-in-use';
    }
    return false;
}

/**
 * Check if error is a rate limiting error
 */
export function isRateLimitError(error: unknown): boolean {
    if (error && typeof error === 'object') {
        const firebaseError = error as { code?: string };
        return firebaseError.code === 'auth/too-many-requests';
    }
    return false;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
    if (!email || email.trim() === '') {
        return 'Please enter your email address';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
    }

    return null;
}

/**
 * Validate password
 */
export function validatePassword(password: string): string | null {
    if (!password) {
        return 'Please enter your password';
    }

    if (password.length < 6) {
        return 'Password must be at least 6 characters';
    }

    return null;
}

/**
 * Validate password confirmation
 */
export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
    if (password !== confirmPassword) {
        return 'Passwords do not match';
    }

    return null;
}
