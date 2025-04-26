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

    // 只讀取 ai_profile/summary
    const aiProfileDoc = await adminDb.doc(`stocks/${stockSymbol}/ai_profile/summary`).get();

    if (!aiProfileDoc.exists) {
        return json({ error: 'Stock AI profile not found' }, { status: 404 });
    }

    const aiProfile = aiProfileDoc.data();

    // 讀取歷史聊天紀錄（最近10筆）
    const chatsSnap = await adminDb.collection(`stocks/${stockSymbol}/chats`)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
    const chatHistory = chatsSnap.docs.map(doc => doc.data()).reverse(); // 由舊到新

    // 建立 system prompt，只用 ai_profile
    const systemPrompt = `
你是「${stockSymbol}」這檔股票的擬人化角色。
你的個性描述是：「${aiProfile.description}」。
你的標籤有：${(aiProfile.tags || []).join('、')}。
請用真誠、有個性又幽默的口吻回答使用者的提問。
如果問到你不懂的問題，也可以可愛地打哈哈，不要死板。
`;

    // 整理成 GPT 的 messages
    const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map(c => ({
            role: c.role as 'user' | 'assistant',
            content: c.content,
        })),
        { role: 'user', content: message }
    ];

    // 呼叫 OpenAI
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // 可選 gpt-4o 或 gpt-4-turbo
        messages: messages,
    });

    const reply = completion.choices[0]?.message?.content ?? "抱歉，今天有點忙，改天再聊～";

    // 儲存這次對話
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
