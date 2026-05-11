/**
 * Dynamically adjusts difficulty based on mastery level.
 * Used for AI prompt engineering and local logic branching.
 */
export const getDifficultyLevel = (mastery: number): 'easy' | 'medium' | 'hard' => {
  if (mastery < 40) return 'easy';
  if (mastery < 70) return 'medium';
  return 'hard';
};
