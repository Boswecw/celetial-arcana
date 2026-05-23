import type { RequestHandler } from "@sveltejs/kit";
import { z } from "zod";
import { aiTrainer, type ReadingFeedback } from "$lib/aiTrainer";
import { loadDotEnv } from "$lib/env";

loadDotEnv();

const FeedbackSchema = z.object({
  readingId: z.string(),
  rating: z.number().min(1).max(5),
  feedback: z.string().max(2000).optional(),
  cards: z.array(z.string()).max(20),
  themes: z.array(z.string()).max(20),
  astroTarotThemes: z.array(z.string()).max(20).optional(),
  userZodiac: z.string().max(40).optional(),
});

const StatsSchema = z.object({
  action: z.enum(["get-stats", "get-recommendations", "export", "import"]),
  data: z.any().optional(),
});

function isAuthorizedAdmin(request: Request): boolean {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return false;
  }
  const provided = request.headers.get("x-admin-token");
  return !!provided && provided === adminToken;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    // Handle feedback submission
    if (body.readingId) {
      const feedbackData = FeedbackSchema.parse(body);

      const feedback: ReadingFeedback = {
        ...feedbackData,
        timestamp: Date.now(),
      };

      aiTrainer.recordFeedback(feedback);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Feedback recorded successfully",
        }),
        {
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Handle stats/admin requests
    const statsData = StatsSchema.parse(body);

    if (!isAuthorizedAdmin(request)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    switch (statsData.action) {
      case "get-stats":
        return new Response(
          JSON.stringify({
            stats: aiTrainer.getStats(),
            recommendations: aiTrainer.getImprovementRecommendations(),
          }),
          {
            headers: { "content-type": "application/json" },
          }
        );

      case "get-recommendations":
        return new Response(
          JSON.stringify({
            recommendations: aiTrainer.getImprovementRecommendations(),
          }),
          {
            headers: { "content-type": "application/json" },
          }
        );

      case "export":
        return new Response(
          JSON.stringify({
            data: aiTrainer.exportTrainingData(),
          }),
          {
            headers: { "content-type": "application/json" },
          }
        );

      case "import":
        if (statsData.data) {
          aiTrainer.importTrainingData(statsData.data);
          return new Response(
            JSON.stringify({
              success: true,
              message: "Training data imported successfully",
            }),
            {
              headers: { "content-type": "application/json" },
            }
          );
        }
        throw new Error("No data provided for import");

      default:
        throw new Error("Unknown action");
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Invalid request payload" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    console.error("[feedback API error]", error);
    return new Response(
      JSON.stringify({ error: "Request failed" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};

