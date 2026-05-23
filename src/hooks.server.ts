import type { Handle } from '@sveltejs/kit';
import { rateLimit } from '$lib/rateLimit';

// Per-route per-IP rate limits.
// AI-spawning routes get tighter caps because each call costs OpenAI tokens
// and (for astro-tarot) a Python subprocess.
const ROUTE_LIMITS: Array<{ prefix: string; limit: number; windowMs: number }> = [
	{ prefix: '/api/astro-tarot', limit: 10, windowMs: 60_000 },
	{ prefix: '/api/combined-reading', limit: 20, windowMs: 60_000 },
	{ prefix: '/api/reading-explanation', limit: 30, windowMs: 60_000 },
	{ prefix: '/api/reading', limit: 20, windowMs: 60_000 },
	{ prefix: '/api/feedback', limit: 30, windowMs: 60_000 },
	{ prefix: '/api/ephemeris', limit: 60, windowMs: 60_000 },
	{ prefix: '/api/cards', limit: 120, windowMs: 60_000 }
];

function matchLimit(pathname: string) {
	for (const entry of ROUTE_LIMITS) {
		if (pathname.startsWith(entry.prefix)) return entry;
	}
	return null;
}

function clientKey(event: Parameters<Handle>[0]['event']): string {
	// Honor common reverse-proxy headers (Render sets x-forwarded-for).
	const fwd = event.request.headers.get('x-forwarded-for');
	if (fwd) return fwd.split(',')[0].trim();
	try {
		return event.getClientAddress();
	} catch {
		return 'unknown';
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const limit = matchLimit(event.url.pathname);
	if (limit) {
		const key = `${event.url.pathname}::${clientKey(event)}`;
		const result = rateLimit(key, limit.limit, limit.windowMs);
		if (!result.allowed) {
			return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
				status: 429,
				headers: {
					'content-type': 'application/json',
					'retry-after': Math.ceil(result.resetMs / 1000).toString()
				}
			});
		}
	}
	return resolve(event);
};
