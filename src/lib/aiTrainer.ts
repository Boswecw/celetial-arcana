/**
 * AI Trainer Module
 * Learns from readings and user feedback to improve future readings
 */

import fs from "node:fs";
import path from "node:path";

export interface ReadingFeedback {
  readingId: string;
  rating: number; // 1-5
  feedback?: string;
  timestamp: number;
  cards: string[];
  themes: string[];
  astroTarotThemes?: string[];
  userZodiac?: string;
}

export interface RatingAggregate {
  sum: number;
  count: number;
}

export interface TrainingData {
  successfulPatterns: Map<string, number>; // Pattern -> success count
  failedPatterns: Map<string, number>; // Pattern -> failure count
  cardCombinations: Map<string, RatingAggregate>; // Card combo -> running mean of ratings
  themeWeights: Map<string, RatingAggregate>; // Theme -> running mean of ratings
  userPreferences: Map<string, any>; // User-specific preferences
}

const DEFAULT_STORE_PATH = path.join(process.cwd(), ".data", "ai-trainer.json");
const STORE_PATH = process.env.AI_TRAINER_STORE_PATH || DEFAULT_STORE_PATH;

class AITrainer {
  private trainingData: TrainingData = {
    successfulPatterns: new Map(),
    failedPatterns: new Map(),
    cardCombinations: new Map(),
    themeWeights: new Map(),
    userPreferences: new Map(),
  };

  private feedbackHistory: ReadingFeedback[] = [];
  private dirty = false;
  private persistTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(STORE_PATH)) return;
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      this.importTrainingData(parsed);
    } catch (err) {
      console.error("[aiTrainer] Failed to load training data:", err);
    }
  }

  private schedulePersist(): void {
    this.dirty = true;
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      if (!this.dirty) return;
      this.dirty = false;
      try {
        fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
        fs.writeFileSync(STORE_PATH, JSON.stringify(this.exportTrainingData()));
      } catch (err) {
        console.error("[aiTrainer] Failed to persist training data:", err);
      }
    }, 1000);
  }

  /**
   * Record feedback on a reading
   */
  recordFeedback(feedback: ReadingFeedback): void {
    this.feedbackHistory.push(feedback);

    // Update training data
    const pattern = this.generatePattern(feedback.cards, feedback.themes);
    const isSuccessful = feedback.rating >= 4;

    if (isSuccessful) {
      this.trainingData.successfulPatterns.set(
        pattern,
        (this.trainingData.successfulPatterns.get(pattern) || 0) + 1
      );
    } else {
      this.trainingData.failedPatterns.set(
        pattern,
        (this.trainingData.failedPatterns.get(pattern) || 0) + 1
      );
    }

    // Update card combination effectiveness (true running mean)
    const cardCombo = feedback.cards.slice().sort().join('+');
    accumulate(this.trainingData.cardCombinations, cardCombo, feedback.rating);

    // Update theme weights (traditional themes)
    feedback.themes.forEach((theme) => {
      accumulate(this.trainingData.themeWeights, theme, feedback.rating);
    });

    // Update astro-tarot theme weights
    feedback.astroTarotThemes?.forEach((theme) => {
      accumulate(this.trainingData.themeWeights, `astro:${theme}`, feedback.rating);
    });

    // Store user preferences
    if (feedback.userZodiac) {
      const userPrefs = this.trainingData.userPreferences.get(feedback.userZodiac) || {
        ratings: [],
        preferredThemes: [],
      };
      userPrefs.ratings.push(feedback.rating);
      userPrefs.preferredThemes.push(...feedback.themes);
      this.trainingData.userPreferences.set(feedback.userZodiac, userPrefs);
    }

    this.schedulePersist();
  }

  /**
   * Generate an optimized system prompt based on training data
   */
  generateOptimizedPrompt(
    userZodiac?: string,
    cards?: string[],
    themes?: string[]
  ): string {
    const basePrompt = `You are Celestia, a mystical tarot and astrology guide. Your readings are:
- Poetic yet grounded in tarot and astrological symbolism
- Specific: cite cards and aspects explicitly
- Probabilistic: avoid deterministic claims; use "may," "could," "suggests"
- Empowering: focus on agency and reflection
- Safe: include disclaimers for sensitive topics
- Consistent: reference the provided deck meanings and astrological lore`;

    let enhancedPrompt = basePrompt;

    // Add user-specific guidance
    if (userZodiac) {
      const userPrefs = this.trainingData.userPreferences.get(userZodiac);
      if (userPrefs && userPrefs.ratings.length > 0) {
        const avgRating = userPrefs.ratings.reduce((a: number, b: number) => a + b, 0) / userPrefs.ratings.length;
        const preferredThemes = [...new Set(userPrefs.preferredThemes)].slice(0, 3);

        enhancedPrompt += `\n\nUser Profile (${userZodiac}):
- Average satisfaction: ${avgRating.toFixed(1)}/5
- Preferred themes: ${preferredThemes.join(", ")}
- Tailor your reading to emphasize these themes when relevant`;
      }
    }

    // Add card-specific guidance based on successful patterns
    if (cards && cards.length > 0) {
      const cardCombo = cards.slice().sort().join("+");
      const effectiveness = meanOf(this.trainingData.cardCombinations.get(cardCombo));

      if (effectiveness > 3.5) {
        enhancedPrompt += `\n\nThis card combination has been highly effective in past readings.
Focus on the dynamic interplay between these cards and their collective message.`;
      }
    }

    // Add theme-specific guidance
    if (themes && themes.length > 0) {
      const topThemes = themes
        .slice()
        .sort((a, b) => meanOf(this.trainingData.themeWeights.get(b)) - meanOf(this.trainingData.themeWeights.get(a)))
        .slice(0, 2);

      if (topThemes.length > 0) {
        enhancedPrompt += `\n\nKey themes to emphasize: ${topThemes.join(", ")}
These themes resonate strongly with users. Weave them throughout the reading.`;
      }
    }

    return enhancedPrompt;
  }

  /**
   * Get recommendations for improving readings
   */
  getImprovementRecommendations(): string[] {
    const recommendations: string[] = [];

    // Find patterns with low success rates
    const failedPatterns = Array.from(this.trainingData.failedPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (failedPatterns.length > 0) {
      recommendations.push(
        `Avoid these patterns: ${failedPatterns.map((p) => p[0]).join(", ")}`
      );
    }

    // Find high-performing themes
    const topThemes = Array.from(this.trainingData.themeWeights.entries())
      .sort((a, b) => meanOf(b[1]) - meanOf(a[1]))
      .slice(0, 3);

    if (topThemes.length > 0) {
      recommendations.push(
        `Focus on these themes: ${topThemes.map((t) => t[0]).join(", ")}`
      );
    }

    // Find effective card combinations
    const topCombos = Array.from(this.trainingData.cardCombinations.entries())
      .filter((c) => meanOf(c[1]) >= 4)
      .slice(0, 3);

    if (topCombos.length > 0) {
      recommendations.push(
        `These card combinations work well: ${topCombos.map((c) => c[0]).join(", ")}`
      );
    }

    return recommendations;
  }

  /**
   * Generate a pattern from cards and themes
   */
  private generatePattern(cards: string[], themes: string[]): string {
    return `${cards.sort().join("+")}|${themes.sort().join("+")}`;
  }

  /**
   * Get training statistics
   */
  getStats() {
    return {
      totalFeedback: this.feedbackHistory.length,
      averageRating:
        this.feedbackHistory.length > 0
          ? this.feedbackHistory.reduce((sum, f) => sum + f.rating, 0) /
            this.feedbackHistory.length
          : 0,
      successfulPatterns: this.trainingData.successfulPatterns.size,
      failedPatterns: this.trainingData.failedPatterns.size,
      uniqueCardCombinations: this.trainingData.cardCombinations.size,
      trackedThemes: this.trainingData.themeWeights.size,
    };
  }

  /**
   * Export training data for persistence
   */
  exportTrainingData() {
    return {
      successfulPatterns: Object.fromEntries(this.trainingData.successfulPatterns),
      failedPatterns: Object.fromEntries(this.trainingData.failedPatterns),
      cardCombinations: Object.fromEntries(this.trainingData.cardCombinations),
      themeWeights: Object.fromEntries(this.trainingData.themeWeights),
      userPreferences: Object.fromEntries(this.trainingData.userPreferences),
      feedbackHistory: this.feedbackHistory,
    };
  }

  /**
   * Import training data
   */
  importTrainingData(data: any): void {
    this.trainingData.successfulPatterns = new Map(
      Object.entries((data.successfulPatterns || {}) as Record<string, number>)
    );
    this.trainingData.failedPatterns = new Map(
      Object.entries((data.failedPatterns || {}) as Record<string, number>)
    );
    this.trainingData.cardCombinations = new Map(
      Object.entries((data.cardCombinations || {}) as Record<string, RatingAggregate | number>).map(
        ([k, v]) => [k, normalizeAggregate(v)]
      )
    );
    this.trainingData.themeWeights = new Map(
      Object.entries((data.themeWeights || {}) as Record<string, RatingAggregate | number>).map(
        ([k, v]) => [k, normalizeAggregate(v)]
      )
    );
    this.trainingData.userPreferences = new Map(
      Object.entries(data.userPreferences || {})
    );
    this.feedbackHistory = data.feedbackHistory || [];
  }
}

function accumulate(map: Map<string, RatingAggregate>, key: string, value: number) {
  const existing = map.get(key);
  if (existing) {
    existing.sum += value;
    existing.count += 1;
  } else {
    map.set(key, { sum: value, count: 1 });
  }
}

function meanOf(agg: RatingAggregate | undefined): number {
  if (!agg || agg.count === 0) return 0;
  return agg.sum / agg.count;
}

// Backwards-compat shim for legacy persisted data that stored a raw average.
function normalizeAggregate(value: RatingAggregate | number): RatingAggregate {
  if (typeof value === "number") {
    return { sum: value, count: 1 };
  }
  return { sum: Number(value.sum) || 0, count: Number(value.count) || 0 };
}

// Export singleton instance
export const aiTrainer = new AITrainer();
