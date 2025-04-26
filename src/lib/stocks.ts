// src/lib/stocks.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchAiProfile(stockSymbol: string) {
  const ref = doc(db, 'stocks', stockSymbol, 'ai_profile', 'summary');
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("資料不存在！");
  return snap.data();
}
