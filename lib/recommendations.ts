import AsyncStorage from '@react-native-async-storage/async-storage';
import { getQuestionsByFilter, QuestionBankItem } from './questionBank';
import { getSubjectMastery, getWeakTopics, MasteryRecord } from './mastery';

/**
 * Returns up to three recommended topics for the user based on mastery.
 * Priority order:
 *   1️⃣ Weak topics (< 50%)
 *   2️⃣ Medium topics (50% - 79%)
 *   3️⃣ Strong topics (>= 80%)
 * Within each bucket the lowest mastery percent is preferred.
 */
export async function getRecommendedTopics(userId: string, subject: string): Promise<string[]> {
  // Fetch all topic mastery records for the subject
  const topicRecords = await getSubjectMastery(userId, subject);
  if (!topicRecords || topicRecords.length === 0) return [];

  // Assign band priority
  const bandPriority = (mastery: number) => {
    if (mastery < 50) return 1;
    if (mastery < 80) return 2;
    return 3;
  };

  // Sort by band first, then by mastery ascending (weakest first)
  const sorted = topicRecords
    .slice()
    .sort((a, b) => {
      const pa = bandPriority(a.mastery_percent);
      const pb = bandPriority(b.mastery_percent);
      if (pa !== pb) return pa - pb;
      return a.mastery_percent - b.mastery_percent; // lower mastery first
    })
    .map(r => r.topic);

  return sorted.slice(0, 3);
}

/**
 * Returns a set of recommended questions for the given subject based on the top recommended topic.
 * If no recommended topic is available, falls back to a random topic.
 */
export async function getRecommendedQuestions(
  userId: string,
  subject: string,
  count: number = 5
): Promise<QuestionBankItem[]> {
  const recommendedTopics = await getRecommendedTopics(userId, subject);
  const topic = recommendedTopics[0] || 'all';
  // Use difficulty = 'all' for simplicity
  const questions = await getQuestionsByFilter(subject, topic, 'all');
  // Shuffle and take the requested count
  const shuffled = questions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Generates a practice plan for the next session.
 * Returns the subject, chosen topic, and an estimated number of questions needed.
 */
export interface PracticePlan {
  subject: string;
  topic: string;
  estimatedQuestions: number;
}

export async function getNextPracticePlan(
  userId: string,
  subject: string,
  count: number = 5
): Promise<PracticePlan | null> {
  const topics = await getRecommendedTopics(userId, subject);
  if (topics.length === 0) return null;
  const chosenTopic = topics[0];
  const questions = await getQuestionsByFilter(subject, chosenTopic, 'all');
  const estimated = Math.min(count, questions.length);
  return {
    subject,
    topic: chosenTopic,
    estimatedQuestions: estimated,
  };
}
