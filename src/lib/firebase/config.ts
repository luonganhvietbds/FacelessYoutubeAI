// Videlix AI - Firebase Configuration (Hybrid: Firestore + Realtime DB)

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyC0oXcW_aXQSRXH2FRRiiYMglnjklbzyfU",
    authDomain: "dmp-nextgen-ai-law.firebaseapp.com",
    databaseURL: "https://dmp-nextgen-ai-law-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dmp-nextgen-ai-law",
    storageBucket: "dmp-nextgen-ai-law.firebasestorage.app",
    messagingSenderId: "996094300478",
    appId: "1:996094300478:web:56f350fbac1ff56ac8dc6f",
    measurementId: "G-GDYYMFTJYN"
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
// Firestore - Primary database for profiles, users, settings
export const db = getFirestore(app);

// Realtime Database - Secondary for live counters, rate limiting, presence
export const realtimeDb = getDatabase(app);

// Auth
export const auth = getAuth(app);

export default app;
