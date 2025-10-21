import type { RequestHandler } from "@sveltejs/kit";
import { getChart } from "$lib/ephemeris";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const date = url.searchParams.get("date");
    const time = url.searchParams.get("time") ?? "12:00:00";
    const lat = Number(url.searchParams.get("lat") ?? 0);
    const lon = Number(url.searchParams.get("lon") ?? 0);

    if (!date) {
      return new Response(JSON.stringify({ error: "date parameter required (YYYY-MM-DD)" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const chart = getChart(date, time, lat, lon);

    return new Response(JSON.stringify(chart), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

