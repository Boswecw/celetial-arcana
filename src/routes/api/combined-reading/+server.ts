import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

interface CombinedReadingRequest {
  question: string;
  traditionalReading: string;
  astroTarotSynthesis: {
    interpretation?: {
      theme?: string;
      action_items?: string[];
      affirmations?: string[];
    };
    astro_summary?: {
      themes?: string[];
      core?: {
        sun?: string;
        moon?: string;
        asc?: string;
        dominant_elements?: string[];
        notable_aspects?: Array<{ aspect: string; interpretation: string }>;
        lunar_phase?: string;
      };
    };
    resonance?: {
      matches?: Array<{ type: string; detail: string }>;
      tensions?: Array<{ type: string; detail: string }>;
    };
  };
  cards: Array<{
    name: string;
    position: string;
    reversed: boolean;
  }>;
  userZodiac?: string;
}

async function generateCombinedReading(payload: CombinedReadingRequest): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Fallback to simple combination
    return generateSimpleCombined(payload);
  }

  try {
    const cardList = payload.cards
      .map((c) => `${c.position}: ${c.name}${c.reversed ? " (reversed)" : ""}`)
      .join("\n");

    const astroThemes = payload.astroTarotSynthesis.astro_summary?.themes?.join(", ") || "cosmic influences";
    const actionItems = payload.astroTarotSynthesis.interpretation?.action_items?.join(", ") || "reflection";

    // Extract detailed birth chart information
    const birthChart = payload.astroTarotSynthesis.astro_summary?.core || {};
    const sunSign = birthChart.sun || "unknown";
    const moonSign = birthChart.moon || "unknown";
    const ascendant = birthChart.asc || "unknown";
    const lunarPhase = birthChart.lunar_phase || "unknown";
    const notableAspects = birthChart.notable_aspects?.map((a: any) => `${a.aspect}: ${a.interpretation}`).join("; ") || "none";
    const dominantElements = birthChart.dominant_elements?.join(", ") || "balanced";

    const systemPrompt = `You are Celestia, a mystical tarot and astrology guide. Your role is to create a detailed, insightful interpretation that deeply combines traditional tarot wisdom with astrological insights.

The reading should:
1. DIRECTLY ADDRESS the user's specific question with clarity and depth
2. WEAVE TOGETHER the traditional card meanings with astrological themes seamlessly
3. EXPLAIN HOW each card relates to their question and the current cosmic influences
4. PROVIDE ACTIONABLE INSIGHTS and empowering guidance
5. HIGHLIGHT CONNECTIONS between the cards, their positions, and the astrological context
6. BE WARM, CONVERSATIONAL, and deeply meaningful
7. INCLUDE SPECIFIC DETAILS from both the tarot and astrology to create a cohesive narrative

Write 2-3 detailed, flowing paragraphs that create a comprehensive interpretation. Make it rich with insight and specific to their situation.

IMPORTANT: Generate 2-3 specific, actionable next steps that directly relate to their question. These should be concrete actions they can take, not generic advice.`;

    const userMessage = `Question: "${payload.question}"

BIRTH CHART PROFILE:
- Sun Sign: ${sunSign}
- Moon Sign: ${moonSign}
- Ascendant: ${ascendant}
- Lunar Phase: ${lunarPhase}
- Dominant Elements: ${dominantElements}
- Key Aspects: ${notableAspects}

Cards drawn:
${cardList}

Traditional Reading Insight:
${payload.traditionalReading}

Astrological Themes: ${astroThemes}
Suggested Actions: ${actionItems}

Affirmations: ${payload.astroTarotSynthesis.interpretation?.affirmations?.join(", ") || "Trust in your journey"}

Please create a detailed, comprehensive reading that deeply combines the card meanings with the astrological context. IMPORTANTLY, weave in their birth chart information (Sun, Moon, Ascendant, aspects) to make this deeply personal and specific to their unique astrological makeup.

Make it specific to their question, weaving together both perspectives into a cohesive narrative that feels personal and insightful.

At the end, provide 2-3 specific, actionable next steps that directly address their question. For example:
- If asking about career: "Schedule a meeting with your manager", "Update your resume", "Research companies in your field"
- If asking about relationships: "Have an honest conversation", "Plan a meaningful date", "Reflect on your boundaries"
- If asking about creative projects: "Set a deadline for your first draft", "Share your work with a trusted friend", "Research your market"

Make these actions specific to their question: "${payload.question}"`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      console.error("Claude API error:", await response.text());
      return generateSimpleCombined(payload);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("Error calling Claude API:", error);
    return generateSimpleCombined(payload);
  }
}

function generateSimpleCombined(payload: CombinedReadingRequest): string {
  const cardNames = payload.cards.map((c) => c.name).join(", ");
  const astroThemes = payload.astroTarotSynthesis.astro_summary?.themes?.join(", ") || "cosmic influences";

  return `Regarding your question "${payload.question}": The cards ${cardNames} combined with current ${astroThemes} suggest a reading that invites reflection and action. Trust the guidance that emerges from this synthesis of tarot wisdom and astrological insight.`;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const payload = (await request.json()) as CombinedReadingRequest;

    // Validate required fields
    if (!payload.question || !payload.traditionalReading || !payload.astroTarotSynthesis) {
      return error(400, "Missing required fields: question, traditionalReading, astroTarotSynthesis");
    }

    // Generate combined reading
    const combinedReading = await generateCombinedReading(payload);

    return json({ reading: combinedReading });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[combined-reading API error]", message);
    return error(500, `Combined reading generation failed: ${message}`);
  }
};

