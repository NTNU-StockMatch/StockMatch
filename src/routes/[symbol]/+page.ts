// src/routes/[symbol]/+page.ts
import type { PageLoad } from './$types';
import { fetchAiProfile } from '$lib/stocks';

export const load: PageLoad = async ({ params }) => {
  const profile = await fetchAiProfile(params.symbol);
  return { profile, symbol: params.symbol };
};