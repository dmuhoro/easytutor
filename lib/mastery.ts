/**
 * Classifies mastery into bands for adaptive logic.
 */
export const getMasteryBand = (mastery: number) => {
  if (mastery < 40) return 'weak';
  if (mastery < 70) return 'developing';
  return 'strong';
};
