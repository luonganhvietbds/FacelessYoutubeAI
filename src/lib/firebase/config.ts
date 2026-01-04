// Videlix AI - Firebase Configuration

import { initializeApp, getApps } from 'firebase/app';
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
export const database = getDatabase(app);
export const auth = getAuth(app);

export default app;
