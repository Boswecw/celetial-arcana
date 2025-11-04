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

    const apiKey = process.env.OPENAI_API_KEY;
    const systemPrompt = `You are Celestia, a mystical tarot and astrology guide. You explain readings in a warm, conversational way.

READING CONTEXT:
${readingContext}

INSTRUCTIONS:
- Explain the reading in simple, accessible language.
- Answer the user's specific question about what the reading means.
- DEEPLY CONNECT each card to the user's specific question and timeframe.
- Show HOW each card relates to their situation (not generic meanings).
- Reference specific cards, astrological themes, and action items from the reading.
- Explain the RESONANCE between tarot cards and astrological influences.
- Be warm, supportive, and empowering.
- Keep responses concise (2-3 paragraphs max).
- Never make predictions; focus on reflection, agency, and guidance.
- Read-only: do not ask for feedback or suggest changes.`;

    const userPrompt = `Question: ${body.userMessage}`;

    let explanation = "";

    if (apiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 600,
          temperature: 0.65,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("[OpenAI error]", errorData);
        return error(500, "Failed to generate explanation");
      }

      const data = await response.json();
      explanation = data.choices?.[0]?.message?.content?.trim() || "";
    } else {
      explanation = buildFallbackExplanation(readingContext, body.userMessage);
    }

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

  if (reading.reading) {
    context += `TRADITIONAL TAROT OVERVIEW:\n${reading.reading}\n\n`;
  }

  if (reading.combinedReading) {
    context += `COMBINED INSIGHT:\n${reading.combinedReading}\n\n`;
  }

  if (reading.analysis?.cards?.length) {
    context += `RULES ENGINE CARD NOTES:\n`;
    reading.analysis.cards.forEach((card: any) => {
      context += `- ${card.position}: ${card.name}${card.reversed ? " (reversed)" : ""} → ${card.meaning}\n`;
    });
    context += "\n";
  }

  return context;
}

function buildFallbackExplanation(context: string, question: string): string {
  return `Here is what the reading is emphasizing regarding "${question}":\n\n${context}\nThis is a condensed summary because no live AI service is connected. Focus on the repeating themes and action items above, and let me know if you'd like to dive into a specific card or astro influence.`;
}
