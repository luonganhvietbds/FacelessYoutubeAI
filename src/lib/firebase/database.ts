// Videlix AI - Realtime Database Service (Counters & Live Data Only)

import {
    ref,
    get,
    set,
    update,
    increment,
    onValue,
    serverTimestamp
} from 'firebase/database';
import { realtimeDb } from './config';

// ==================== LIVE COUNTERS ====================

const COUNTERS_PATH = 'counters';

// Daily generation counter
export async function incrementDailyCounter(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const counterRef = ref(realtimeDb, `${COUNTERS_PATH}/daily/${today}/generations`);

    const snapshot = await get(counterRef);
    const currentCount = snapshot.exists() ? snapshot.val() : 0;
    await set(counterRef, currentCount + 1);
}

export async function getDailyCount(date?: string): Promise<number> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const counterRef = ref(realtimeDb, `${COUNTERS_PATH}/daily/${targetDate}/generations`);

    const snapshot = await get(counterRef);
    return snapshot.exists() ? snapshot.val() : 0;
}

// Profile usage counter
export async function incrementProfileCounter(profileId: string): Promise<void> {
    const counterRef = ref(realtimeDb, `${COUNTERS_PATH}/profiles/${profileId}`);

    const snapshot = await get(counterRef);
    const currentCount = snapshot.exists() ? snapshot.val() : 0;
    await set(counterRef, currentCount + 1);
}

export async function getProfileUsageStats(): Promise<Record<string, number>> {
    const countersRef = ref(realtimeDb, `${COUNTERS_PATH}/profiles`);
    const snapshot = await get(countersRef);

    return snapshot.exists() ? snapshot.val() : {};
}

// Subscribe to live counter updates
export function subscribeToProfileCounters(
    callback: (counts: Record<string, number>) => void
): () => void {
    const countersRef = ref(realtimeDb, `${COUNTERS_PATH}/profiles`);

    return onValue(countersRef, (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : {});
    });
}

// ==================== RATE LIMITING ====================

const RATE_LIMIT_PATH = 'rateLimit';
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

export async function checkRateLimit(
    identifier: string,
    maxRequests: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const now = Date.now();
    const limitRef = ref(realtimeDb, `${RATE_LIMIT_PATH}/${identifier}`);

    const snapshot = await get(limitRef);
    const record: RateLimitRecord | null = snapshot.exists() ? snapshot.val() : null;

    // Check if window has expired
    if (!record || now > record.resetAt) {
        // New window
        await set(limitRef, {
            count: 1,
            resetAt: now + RATE_WINDOW_MS,
        });
        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetIn: RATE_WINDOW_MS
        };
    }

    // Check if under limit
    if (record.count < maxRequests) {
        await update(limitRef, { count: record.count + 1 });
        return {
            allowed: true,
            remaining: maxRequests - record.count - 1,
            resetIn: record.resetAt - now
        };
    }

    // Rate limited
    return {
        allowed: false,
        remaining: 0,
        resetIn: record.resetAt - now
    };
}

// ==================== USER PRESENCE ====================

const PRESENCE_PATH = 'presence';

export async function updatePresence(userId: string, online: boolean): Promise<void> {
    const presenceRef = ref(realtimeDb, `${PRESENCE_PATH}/${userId}`);

    await set(presenceRef, {
        online,
        lastSeen: serverTimestamp(),
    });
}

export async function getUserPresence(userId: string): Promise<{ online: boolean; lastSeen: number } | null> {
    const presenceRef = ref(realtimeDb, `${PRESENCE_PATH}/${userId}`);
    const snapshot = await get(presenceRef);

    return snapshot.exists() ? snapshot.val() : null;
}

export function subscribeToPresence(
    userId: string,
    callback: (presence: { online: boolean; lastSeen: number } | null) => void
): () => void {
    const presenceRef = ref(realtimeDb, `${PRESENCE_PATH}/${userId}`);

    return onValue(presenceRef, (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : null);
    });
}

// ==================== ANALYTICS HELPERS ====================

export async function getTotalGenerations(): Promise<number> {
    const countersRef = ref(realtimeDb, `${COUNTERS_PATH}/profiles`);
    const snapshot = await get(countersRef);

    if (!snapshot.exists()) return 0;

    const counts = snapshot.val();
    return Object.values(counts).reduce((sum: number, count) => sum + (count as number), 0);
}

export async function getWeeklyStats(): Promise<{ date: string; count: number }[]> {
    const stats: { date: string; count: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = await getDailyCount(dateStr);
        stats.push({ date: dateStr, count });
    }

    return stats;
}
