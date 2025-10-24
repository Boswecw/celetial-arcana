import type { RequestHandler } from "@sveltejs/kit";
import { json, error } from "@sveltejs/kit";

interface ExplanationRequest {
  reading: any;
  userMessage: string;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = (await request.json()) as ExplanationRequest;

    if (!body.reading || !body.userMessage) {
      return error(400, "Missing reading or userMessage");
    }

    // Build context from the reading
    const readingContext = buildReadingContext(body.reading);

    // Call Ollama with conversation model
    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi",
        messages: [
          {
            role: "system",
            content: `You are Celestia, a mystical tarot and astrology guide. You explain readings in a warm, conversational way.

READING CONTEXT:
${readingContext}

INSTRUCTIONS:
- Explain the reading in simple, accessible language
- Answer the user's specific question about what the reading means
- DEEPLY CONNECT each card to the user's specific question and timeframe
- Show HOW each card relates to their situation (not generic meanings)
- Reference specific cards and astrological themes from the reading
- Explain the RESONANCE between tarot cards and astrological influences
- Connect card meanings to the action items and affirmations provided
- Be warm, supportive, and empowering
- Keep responses concise (2-3 paragraphs max)
- Never make predictions; focus on reflection and guidance
- Read-only: do not ask for feedback or suggest changes

IMPORTANT: Focus on the SPECIFIC CONTEXT of their question, not generic card meanings.`,
          },
          {
            role: "user",
            content: body.userMessage,
          },
        ],
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500,  // More tokens for detailed explanations
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[Ollama error]", errorData);
      return error(500, "Failed to generate explanation");
    }

    const data = await response.json();
    const explanation = data.message?.content || "";

    return json({
      success: true,
      explanation,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[reading-explanation error]", message);
    return error(500, `Explanation failed: ${message}`);
  }
};

function buildReadingContext(reading: any): string {
  let context = "";

  if (reading.meta) {
    context += `Question: ${reading.meta.question}\n`;
    context += `Timeframe: ${reading.meta.timeframe}\n\n`;
  }

  if (reading.astroTarot) {
    const astro = reading.astroTarot;

    if (astro.astro_summary?.core) {
      const core = astro.astro_summary.core;
      context += `ASTROLOGICAL CONTEXT:\n`;
      if (core.sun) context += `- Sun: ${core.sun}\n`;
      if (core.moon) context += `- Moon: ${core.moon}\n`;
      if (core.asc) context += `- Ascendant: ${core.asc}\n`;
      if (core.lunar_phase) context += `- Lunar Phase: ${core.lunar_phase}\n`;
      context += "\n";
    }

    if (astro.astro_summary?.themes) {
      context += `Astrological Themes: ${astro.astro_summary.themes.join(", ")}\n\n`;
    }

    if (astro.spread_summary?.layout) {
      context += `TAROT SPREAD (with positions and meanings):\n`;
      astro.spread_summary.layout.forEach((item: string) => {
        context += `- ${item}\n`;
      });
      context += "\n";
    }

    // Add detailed card interpretations if available
    if (astro.interpretation?.positions && astro.interpretation.positions.length > 0) {
      context += `DETAILED CARD INTERPRETATIONS:\n`;
      astro.interpretation.positions.forEach((pos: any) => {
        if (pos.card) {
          context += `\n${pos.card}:\n`;
          if (pos.meaning) context += `  Meaning: ${pos.meaning}\n`;
          if (pos.connection) context += `  Connection to question: ${pos.connection}\n`;
        }
      });
      context += "\n";
    }

    if (astro.interpretation?.theme) {
      context += `READING THEME: ${astro.interpretation.theme}\n\n`;
    }

    if (astro.resonance?.matches && astro.resonance.matches.length > 0) {
      context += `KEY HARMONIES:\n`;
      astro.resonance.matches.forEach((match: any) => {
        context += `- ${match.detail}\n`;
      });
      context += "\n";
    }

    if (astro.resonance?.tensions && astro.resonance.tensions.length > 0) {
      context += `AREAS OF GROWTH:\n`;
      astro.resonance.tensions.forEach((tension: any) => {
        context += `- ${tension.detail}\n`;
      });
      context += "\n";
    }

    if (astro.interpretation?.action_items && astro.interpretation.action_items.length > 0) {
      context += `SUGGESTED ACTIONS:\n`;
      astro.interpretation.action_items.forEach((action: string) => {
        context += `- ${action}\n`;
      });
      context += "\n";
    }

    if (astro.interpretation?.affirmations && astro.interpretation.affirmations.length > 0) {
      context += `AFFIRMATIONS:\n`;
      astro.interpretation.affirmations.forEach((aff: string) => {
        context += `- ${aff}\n`;
      });
    }
  }

  return context;
}

