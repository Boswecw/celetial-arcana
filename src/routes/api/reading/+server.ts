import type { RequestHandler } from "@sveltejs/kit";
import { z } from "zod";
import { analyzeReading } from "$lib/rulesEngine";
import { buildReadingContext } from "$lib/rag";
import { buildSafeResponse } from "$lib/guardrails";
import { aiTrainer } from "$lib/aiTrainer";

const Schema = z.object({
  question: z.string().optional(),
  draw: z.array(
    z.object({
      position: z.string(),
      reversed: z.boolean(),
      card: z.object({
        name: z.string(),
        upright: z.string(),
        reversed: z.string(),
      }),
    })
  ),
  ephemeris: z.any().optional(),
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = Schema.parse(await request.json());

    // Analyze reading with rules engine
    const analysis = analyzeReading(
      body.ephemeris ?? null,
      body.draw.map((d) => ({
        name: d.card.name,
        reversed: d.reversed,
        position: d.position,
      }))
    );

    // Build RAG context
    const cardNames = body.draw.map((d) => d.card.name);
    const aspectTypes = analysis.aspects.map((a) => a.type);
    const ragContext = buildReadingContext(cardNames, aspectTypes, analysis.themes);

    // Generate reading with LLM (using ChatGPT if available)
    let reading = await generateReading(body, analysis, ragContext);

    // Apply guardrails
    const safeResponse = buildSafeResponse(reading, body.question);

    return new Response(
      JSON.stringify({
        reading: safeResponse.reading,
        disclaimer: safeResponse.disclaimer,
        warnings: safeResponse.warnings,
        resources: safeResponse.resources,
        analysis: {
          cards: analysis.cards,
          aspects: analysis.aspects,
          themes: analysis.themes,
          weights: analysis.weights,
        },
      }),
      {
        headers: { "content-type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

async function generateReading(
  body: any,
  analysis: any,
  ragContext: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Fallback to mock reading if no API key
    return generateMockReading(body, analysis);
  }

  try {
    // Get optimized prompt from AI trainer
    const cardNames = body.draw.map((d: any) => d.card.name);
    const optimizedPrompt = aiTrainer.generateOptimizedPrompt(
      body.userZodiac,
      cardNames,
      analysis.themes
    );

    const systemPrompt = `${optimizedPrompt}

${ragContext}`;

    const userMessage = `
Question: ${body.question || "General reading"}

Cards drawn:
${body.draw.map((d: any) => `- ${d.position}: ${d.card.name}${d.reversed ? " (reversed)" : ""}`).join("\n")}

Themes: ${analysis.themes.join(", ")}
Key aspects: ${analysis.aspects.map((a: any) => `${a.planet1} ${a.type} ${a.planet2}`).join(", ")}

Please weave a cohesive reading that integrates these elements.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return generateMockReading(body, analysis);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return generateMockReading(body, analysis);
  }
}

function generateMockReading(body: any, analysis: any): string {
  const cardList = body.draw.map((d: any) => `${d.card.name}${d.reversed ? " (reversed)" : ""}`).join(", ");
  const themes = analysis.themes.join(", ") || "balance and reflection";

  return `✨ **Your Reading**

The cards speak of ${themes}.

**Cards in your spread:** ${cardList}

This reading suggests a moment of reflection and potential. The interplay of these cards invites you to consider your current circumstances with fresh perspective. Trust your intuition as you navigate the themes that emerge.

Remember: this reading is a mirror for reflection, not a prediction of fixed outcomes. Your choices and actions shape your path forward.`;
}
