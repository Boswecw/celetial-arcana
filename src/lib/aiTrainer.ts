/**
 * AI Trainer Module
 * Learns from readings and user feedback to improve future readings
 */

export interface ReadingFeedback {
  readingId: string;
  rating: number; // 1-5
  feedback: string;
  timestamp: number;
  cards: string[];
  themes: string[];
  astroTarotThemes?: string[];
  userZodiac?: string;
}

export interface TrainingData {
  successfulPatterns: Map<string, number>; // Pattern -> success count
  failedPatterns: Map<string, number>; // Pattern -> failure count
  cardCombinations: Map<string, number>; // Card combo -> effectiveness
  themeWeights: Map<string, number>; // Theme -> average rating
  userPreferences: Map<string, any>; // User-specific preferences
}

class AITrainer {
  private trainingData: TrainingData = {
    successfulPatterns: new Map(),
    failedPatterns: new Map(),
    cardCombinations: new Map(),
    themeWeights: new Map(),
    userPreferences: new Map(),
  };

  private feedbackHistory: ReadingFeedback[] = [];

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

    // Update card combination effectiveness
    const cardCombo = feedback.cards.sort().join('+');
    const currentScore = this.trainingData.cardCombinations.get(cardCombo) || 0;
    this.trainingData.cardCombinations.set(
      cardCombo,
      (currentScore + feedback.rating) / 2
    );

    // Update theme weights (traditional themes)
    feedback.themes.forEach((theme) => {
      const currentWeight = this.trainingData.themeWeights.get(theme) || 0;
      this.trainingData.themeWeights.set(
        theme,
        (currentWeight + feedback.rating) / 2
      );
    });

    // Update astro-tarot theme weights
    if (feedback.astroTarotThemes) {
      feedback.astroTarotThemes.forEach((theme) => {
        const currentWeight = this.trainingData.themeWeights.get(`astro:${theme}`) || 0;
        this.trainingData.themeWeights.set(
          `astro:${theme}`,
          (currentWeight + feedback.rating) / 2
        );
      });
    }

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
      const cardCombo = cards.sort().join("+");
      const effectiveness = this.trainingData.cardCombinations.get(cardCombo);

      if (effectiveness && effectiveness > 3.5) {
        enhancedPrompt += `\n\nThis card combination has been highly effective in past readings.
Focus on the dynamic interplay between these cards and their collective message.`;
      }
    }

    // Add theme-specific guidance
    if (themes && themes.length > 0) {
      const topThemes = themes
        .sort((a, b) => {
          const weightA = this.trainingData.themeWeights.get(a) || 0;
          const weightB = this.trainingData.themeWeights.get(b) || 0;
          return weightB - weightA;
        })
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
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topThemes.length > 0) {
      recommendations.push(
        `Focus on these themes: ${topThemes.map((t) => t[0]).join(", ")}`
      );
    }

    // Find effective card combinations
    const topCombos = Array.from(this.trainingData.cardCombinations.entries())
      .filter((c) => c[1] >= 4)
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
      Object.entries(data.successfulPatterns || {})
    );
    this.trainingData.failedPatterns = new Map(
      Object.entries(data.failedPatterns || {})
    );
    this.trainingData.cardCombinations = new Map(
      Object.entries(data.cardCombinations || {})
    );
    this.trainingData.themeWeights = new Map(
      Object.entries(data.themeWeights || {})
    );
    this.trainingData.userPreferences = new Map(
      Object.entries(data.userPreferences || {})
    );
    this.feedbackHistory = data.feedbackHistory || [];
  }
}

// Export singleton instance
export const aiTrainer = new AITrainer();

