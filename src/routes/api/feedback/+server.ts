import type { RequestHandler } from "@sveltejs/kit";
import { z } from "zod";
import { aiTrainer, type ReadingFeedback } from "$lib/aiTrainer";

const FeedbackSchema = z.object({
  readingId: z.string(),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
  cards: z.array(z.string()),
  themes: z.array(z.string()),
  userZodiac: z.string().optional(),
});

const StatsSchema = z.object({
  action: z.enum(["get-stats", "get-recommendations", "export", "import"]),
  data: z.any().optional(),
});

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
          stats: aiTrainer.getStats(),
        }),
        {
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Handle stats/admin requests
    const statsData = StatsSchema.parse(body);

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
    return new Response(
      JSON.stringify({
        error: String(error),
      }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      }
    );
  }
};

