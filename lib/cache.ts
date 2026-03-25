import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateQuizQuestion } from './api';
import { SUBJECTS } from './subjects';

export const saveResponse = async (subjectId: string, topic: string, mode: string, response: string) => {
  const key = `cache_res_${subjectId}_${topic}_${mode}`;
  await AsyncStorage.setItem(key, response);
  
  const cachedTopicsKey = `cache_topics_${subjectId}`;
  const existing = await AsyncStorage.getItem(cachedTopicsKey);
  const topics: string[] = existing ? JSON.parse(existing) : [];
  if (!topics.includes(topic)) {
    topics.push(topic);
    await AsyncStorage.setItem(cachedTopicsKey, JSON.stringify(topics));
  }
};

export const getCachedResponse = async (subjectId: string, topic: string, mode: string) => {
  const key = `cache_res_${subjectId}_${topic}_${mode}`;
  return await AsyncStorage.getItem(key);
};

export const getCachedTopicsForSubject = async (subjectId: string): Promise<string[]> => {
  const key = `cache_topics_${subjectId}`;
  const existing = await AsyncStorage.getItem(key);
  return existing ? JSON.parse(existing) : [];
};

export const saveQuizQuestions = async (subjectId: string, questions: any[]) => {
  const key = `cache_quiz_${subjectId}`;
  await AsyncStorage.setItem(key, JSON.stringify(questions));
};

export const getCachedQuizQuestions = async (subjectId: string): Promise<any[]> => {
  const key = `cache_quiz_${subjectId}`;
  const existing = await AsyncStorage.getItem(key);
  return existing ? JSON.parse(existing) : [];
};

export const preloadQuizCache = async () => {
  const isPreloaded = await AsyncStorage.getItem('quiz_cache_initialized');
  if (isPreloaded === 'true') return;

  console.log('Preloading quiz cache for offline usage...');
  for (const subject of SUBJECTS) {
    const questions = [];
    // Just fetch 3 questions for the first topic to avoid massive API spam during demo
    for (let i = 0; i < 3; i++) {
      const topic = subject.topics[0];
      if (!topic) continue;
      const res = await generateQuizQuestion(subject.name, topic);
      if (res.success && res.data) {
        questions.push(res.data);
      }
    }
    await saveQuizQuestions(subject.id, questions);
  }
  await AsyncStorage.setItem('quiz_cache_initialized', 'true');
  console.log('Quiz cache preloaded!');
};
