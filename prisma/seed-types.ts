export type ExInput = {
  type: string;
  promptArabic?: string;
  promptLatin?: string;
  promptText?: string;
  correctAnswers: string[];
  distractors?: string[];
  tokens?: string[];
  options?: string[];
  explanation?: string;
  hint?: string;
  difficulty?: number;
  conceptKeys: string[];
  metadata?: Record<string, unknown>;
};
