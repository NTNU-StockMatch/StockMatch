import { adminDb } from '$lib/server/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { json } from '@sveltejs/kit';

export async function GET({ request }) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    try {
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        // 🔥 這裡就可以安全地拿 uid 去讀 likes, stocks 等資料
        const likesSnap = await adminDb.collection('users').doc(uid).collection('likes').get();
        const likedIds = likesSnap.docs.map(doc => doc.id);

        const stocksSnap = await adminDb.collection('stocks').get();

        const stocks = [];
        for (const docSnap of stocksSnap.docs) {
            if (!likedIds.includes(docSnap.id)) {
                const aiSnap = await adminDb.doc(`stocks/${docSnap.id}/ai_profile/summary`).get();
                stocks.push({
                    id: docSnap.id,
                    ...docSnap.data(),
                    aiProfile: aiSnap.exists ? aiSnap.data() : null
                });
            }
        }

        return json(stocks);

    } catch (err) {
        console.error('Token 驗證失敗', err);
        return new Response('Unauthorized', { status: 401 });
    }
}
