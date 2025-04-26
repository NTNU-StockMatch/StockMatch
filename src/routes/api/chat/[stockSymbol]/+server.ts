// src/routes/api/chat/[stockSymbol]/+server.ts

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebaseAdmin';
import { OpenAI } from 'openai';

// 初始化 OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST({ request, params }) {
    const { stockSymbol } = params;
    const { message } = await request.json();

    // 1. 讀取 profile & ai_profile
    const profileDoc = await adminDb.doc(`stocks/${stockSymbol}/profile`).get();
    const aiProfileDoc = await adminDb.doc(`stocks/${stockSymbol}/ai_profile/summary`).get();

    if (!profileDoc.exists || !aiProfileDoc.exists) {
        return json({ error: 'Stock not found' }, { status: 404 });
    }

    const profile = profileDoc.data();
    const aiProfile = aiProfileDoc.data();

    // 2. 讀取歷史聊天紀錄（最近10筆）
    const chatsSnap = await adminDb.collection(`stocks/${stockSymbol}/chats`)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
    const chatHistory = chatsSnap.docs.map(doc => doc.data()).reverse(); // 由舊到新

    // 3. 組成 system prompt
    const systemPrompt = `
你是「${profile.name}」（${profile.industry}產業），股票代碼：${stockSymbol}，上市於 ${profile.market}。
你的個性描述是：「${aiProfile.description}」。
你的標籤有：${(aiProfile.tags || []).join('、')}。
基本介紹：${profile.long_business_summary}

用「股票本人」的口吻，真誠、有個性地回應使用者提問。
`;

    // 4. 整理成 GPT 的 messages
    const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map(c => ({
            role: c.role as 'user' | 'assistant',
            content: c.content,
        })),
        { role: 'user', content: message }
    ];

    // 5. 呼叫 OpenAI
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // 可以換成 gpt-4o, gpt-4-turbo, gpt-4
        messages: messages,
    });

    const reply = completion.choices[0]?.message?.content ?? "抱歉，目前暫時無法回答你的問題喔。";

    // 6. 儲存這次對話
    const chatsCollection = adminDb.collection(`stocks/${stockSymbol}/chats`);
    await Promise.all([
        chatsCollection.add({
            role: 'user',
            content: message,
            timestamp: new Date(),
        }),
        chatsCollection.add({
            role: 'assistant',
            content: reply,
            timestamp: new Date(),
        }),
    ]);

    return json({ reply });
}
