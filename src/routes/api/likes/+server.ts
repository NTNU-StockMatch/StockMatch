// 喜歡一檔股票
import { adminDb } from '$lib/server/firebaseAdmin';
import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';

export async function GET({request, locals }) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;


    if (!uid) return new Response('Unauthorized', { status: 401 });

    const likesSnap = await adminDb.collection('users').doc(uid).collection('likes').get();
    const likedIds = likesSnap.docs.map(doc => doc.id);

    const stocksSnap = await adminDb.collection('stocks').get();

    const stocks = [];
    for (const stockDoc of stocksSnap.docs) {
        if (!likedIds.includes(stockDoc.id)) {
            const aiSnap = await adminDb.doc(`stocks/${stockDoc.id}/ai_profile/summary`).get();
            stocks.push({
                id: stockDoc.id,
                ...stockDoc.data(),
                aiProfile: aiSnap.exists ? aiSnap.data() : null
            });
        }
    }

    return json(stocks);
}

export async function POST({ request, locals }) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!uid) return new Response('Unauthorized', { status: 401 });

    const { stockId } = await request.json();

    await adminDb.collection('users').doc(uid).collection('likes').doc(stockId).set({
        likedAt: new Date()
    });

    return json({ success: true });
}

export async function DELETE({ request, locals }) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    const { stockId } = await request.json();

    await adminDb.collection('users').doc(uid).collection('likes').doc(stockId).delete();

    return json({ success: true });
}
