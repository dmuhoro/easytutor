export const adjustDifficulty = ({
  correctStreak,
  wrongStreak,
  currentDifficulty
}: {
  correctStreak: number;
  wrongStreak: number;
  currentDifficulty: string;
}): string => {
  if (correctStreak >= 3) {
    if (currentDifficulty === 'easy') return 'medium';
    if (currentDifficulty === 'medium') return 'hard';
  }

  if (wrongStreak >= 2) {
    if (currentDifficulty === 'hard') return 'medium';
    if (currentDifficulty === 'medium') return 'easy';
  }

  return currentDifficulty;
};

export const getBatchSize = (wrongStreak: number): number => {
  if (wrongStreak >= 3) return 3; // shorter sessions to prevent burnout
  return 5;
};
