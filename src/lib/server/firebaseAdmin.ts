// src/lib/server/firebaseAdmin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
    initializeApp({
        credential: cert({
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            clientEmail: import.meta.env.VITE_FIREBASE_CLIENT_EMAIL,
            privateKey: import.meta.env.VITE_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
    });
}

export const adminDb = getFirestore();
