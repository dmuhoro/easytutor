export interface SpacedItem {
  id: string;
  lastReview: string;
  interval: number; // in days
  easeFactor: number;
}

/**
 * Calculates next review date based on a simplified SM-2 algorithm.
 */
export const calculateNextReview = (
  item: SpacedItem,
  quality: number // 0-5
): SpacedItem => {
  let { interval, easeFactor } = item;

  if (quality >= 3) {
    // Correct response
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    
    // Update ease factor (min 1.3)
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  } else {
    // Incorrect response, reset interval
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  return {
    ...item,
    interval,
    easeFactor,
    lastReview: new Date().toISOString(),
  };
};

/**
 * Returns topics due for review.
 */
export const getDueItems = <T extends SpacedItem>(items: T[]): T[] => {
  const now = new Date();
  return items.filter((item) => {
    const last = new Date(item.lastReview);
    const due = new Date(last.getTime() + item.interval * 24 * 60 * 60 * 1000);
    return now >= due;
  });
};
