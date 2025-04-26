// src/lib/server/firebaseAdmin.ts
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let dbInstance: ReturnType<typeof getFirestore> | null = null;

export function AdminDb() {
    if (dbInstance) {
        return dbInstance;
    }

    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.VITE_FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.VITE_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing Firebase environment variables');
    }

    if (getApps().length === 0) {
        initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey
            })
        });
    }

    dbInstance = getFirestore();
    return dbInstance;
}
