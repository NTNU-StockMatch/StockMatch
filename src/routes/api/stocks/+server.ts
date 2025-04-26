// src/routes/api/stocks/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	return json({ message: 'Hello from /api/stocks!' });
};
