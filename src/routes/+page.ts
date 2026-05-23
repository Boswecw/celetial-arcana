// Landing page is fully static — no API calls, no user state — so it can be
// prerendered at build time and served from the CDN with no SSR cost.
export const prerender = true;
