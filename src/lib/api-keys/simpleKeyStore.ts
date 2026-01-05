// Videlix AI - Simple API Key Management (localStorage)
// Users input key directly in UI, stored in localStorage

const STORAGE_KEY = 'videlix_api_key';

/**
 * Get the stored API key from localStorage
 */
export function getApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
}

/**
 * Save API key to localStorage
 */
export function saveApiKey(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, key);
}

/**
 * Remove API key from localStorage
 */
export function removeApiKey(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if API key exists
 */
export function hasApiKey(): boolean {
    return !!getApiKey();
}

/**
 * Mask API key for display (show first 4 and last 4 chars)
 */
export function maskApiKey(key: string): string {
    if (key.length <= 12) return '****';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
