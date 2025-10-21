export interface GuardrailResult {
  passed: boolean;
  warnings: string[];
  sanitized: string;
  disclaimer: string;
}

const SENSITIVE_TOPICS = [
  'death',
  'suicide',
  'harm',
  'abuse',
  'illness',
  'disease',
  'medical',
  'diagnosis',
  'treatment',
  'cure',
];

const DETERMINISTIC_PHRASES = [
  'will definitely',
  'will certainly',
  'guaranteed',
  'must happen',
  'is destined',
  'fate has decided',
  'you are doomed',
  'you will fail',
  'you will succeed',
];

const SAFE_LANGUAGE_REPLACEMENTS: Record<string, string> = {
  'will definitely': 'may',
  'will certainly': 'might',
  'guaranteed': 'suggested',
  'must happen': 'could happen',
  'is destined': 'is indicated',
  'you are doomed': 'you face challenges',
  'you will fail': 'you may encounter obstacles',
  'you will succeed': 'you have potential for',
};

const DISCLAIMERS = {
  general: `⚠️ **Disclaimer**: This reading is for entertainment and reflection purposes only. Tarot and astrology are not substitutes for professional advice. Please consult qualified professionals for medical, legal, financial, or mental health matters.`,
  sensitive: `⚠️ **Important**: This reading touches on sensitive topics. If you're experiencing distress, please reach out to a mental health professional or crisis helpline.`,
  medical: `⚠️ **Medical Disclaimer**: This reading cannot diagnose, treat, or cure any medical condition. Always consult a healthcare provider for health concerns.`,
  mental_health: `⚠️ **Mental Health**: If you're struggling with your mental health, please contact a mental health professional or crisis service.`,
};

const CRISIS_RESOURCES = {
  us: 'National Suicide Prevention Lifeline: 988 | Crisis Text Line: Text HOME to 741741',
  uk: 'Samaritans: 116 123 | Crisis Text Line: Text SHOUT to 85258',
  au: 'Lifeline: 13 11 14 | Crisis Text Line: Text HELLO to 50808',
  ca: 'Canada Suicide Prevention Service: 1-833-456-4566',
};

/**
 * Check if content contains sensitive topics
 */
export function hasSensitiveContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SENSITIVE_TOPICS.some((topic) => lowerText.includes(topic));
}

/**
 * Check if content contains deterministic language
 */
export function hasDeterministicLanguage(text: string): boolean {
  const lowerText = text.toLowerCase();
  return DETERMINISTIC_PHRASES.some((phrase) => lowerText.includes(phrase));
}

/**
 * Sanitize content to remove deterministic language
 */
export function sanitizeContent(text: string): string {
  let sanitized = text;

  Object.entries(SAFE_LANGUAGE_REPLACEMENTS).forEach(([phrase, replacement]) => {
    const regex = new RegExp(phrase, 'gi');
    sanitized = sanitized.replace(regex, replacement);
  });

  return sanitized;
}

/**
 * Apply guardrails to LLM output
 */
export function applyGuardrails(content: string, userQuestion?: string): GuardrailResult {
  const warnings: string[] = [];
  let sanitized = content;
  let disclaimer = DISCLAIMERS.general;

  // Check for sensitive topics
  const isSensitive = hasSensitiveContent(content) || (userQuestion && hasSensitiveContent(userQuestion));
  if (isSensitive) {
    warnings.push('This reading addresses sensitive topics. Please seek professional support if needed.');
    disclaimer = DISCLAIMERS.sensitive;
  }

  // Check for medical content
  if (content.toLowerCase().includes('health') || content.toLowerCase().includes('medical')) {
    warnings.push('This reading mentions health topics. Consult a healthcare provider for medical concerns.');
    disclaimer = DISCLAIMERS.medical;
  }

  // Check for mental health content
  if (
    content.toLowerCase().includes('mental') ||
    content.toLowerCase().includes('depression') ||
    content.toLowerCase().includes('anxiety')
  ) {
    warnings.push('This reading touches on mental health. Consider speaking with a mental health professional.');
    disclaimer = DISCLAIMERS.mental_health;
  }

  // Check for deterministic language
  if (hasDeterministicLanguage(content)) {
    warnings.push('Softening deterministic language to reflect uncertainty and personal agency.');
    sanitized = sanitizeContent(content);
  }

  // Add well-being nudge if sensitive
  if (isSensitive) {
    sanitized += '\n\n💫 **Remember**: You have agency in shaping your future. This reading is a reflection tool, not a prediction.';
  }

  return {
    passed: warnings.length === 0,
    warnings,
    sanitized,
    disclaimer,
  };
}

/**
 * Get appropriate crisis resources based on region
 */
export function getCrisisResources(region: string = 'us'): string {
  return CRISIS_RESOURCES[region as keyof typeof CRISIS_RESOURCES] || CRISIS_RESOURCES.us;
}

/**
 * Build full response with guardrails
 */
export function buildSafeResponse(
  reading: string,
  userQuestion?: string,
  region?: string
): {
  reading: string;
  disclaimer: string;
  warnings: string[];
  resources?: string;
} {
  const guardrails = applyGuardrails(reading, userQuestion);

  const response = {
    reading: guardrails.sanitized,
    disclaimer: guardrails.disclaimer,
    warnings: guardrails.warnings,
  };

  if (guardrails.warnings.some((w) => w.includes('mental health') || w.includes('sensitive'))) {
    response.resources = getCrisisResources(region);
  }

  return response;
}

