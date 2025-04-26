import { getAuth } from 'firebase-admin/auth';
import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebaseAdmin';

export async function POST({ request }) {
    const { idToken } = await request.json();

    try {
        // 1. 驗證 Google OAuth 的 ID Token
        const decoded = await getAuth().verifyIdToken(idToken);

        const uid = decoded.uid;
        const userRecord = await getAuth().getUser(uid);

        // 2. 這裡可以選擇要不要建立自己系統的 User 資料（例如 Firestore users/{uid}）

        await adminDb.collection('users').doc(uid).set({
            name: userRecord.displayName,
            email: userRecord.email,
            photoURL: userRecord.photoURL,
            joinedAt: new Date()
        }, { merge: true });

        // 3. 回傳登入成功
        return json({
            token: idToken, // 你也可以改成自己簽自己的 token
            user: {
                uid,
                email: userRecord.email,
                name: userRecord.displayName,
                photoURL: userRecord.photoURL
            }
        });

    } catch (err) {
        console.error('登入失敗', err);
        return new Response('Unauthorized', { status: 401 });
    }
}
