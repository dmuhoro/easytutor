import { AIQuizQuestion } from '../types/quiz';

const quizCache = new Map<string, AIQuizQuestion[]>();

export const getCacheKey = ({ topicTitle, difficulty }: { topicTitle: string, difficulty: string }) =>
  `${topicTitle}-${difficulty}`;

export const getCachedQuiz = (key: string): AIQuizQuestion[] => {
  return quizCache.get(key) || [];
};

export const setCachedQuiz = (key: string, questions: AIQuizQuestion[]) => {
  quizCache.set(key, questions);
};
