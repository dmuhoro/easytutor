import { AIQuizQuestion } from '../types/quiz';
import { generateAIQuizBatch, getStaticQuestion } from './aiQuiz';
import { getCacheKey, getCachedQuiz, setCachedQuiz } from './quizCache';
import { getSupabaseClient, logSupabaseError, getAuthenticatedUser } from './supabaseOps';

export const fetchCachedFromDB = async (topicId: string): Promise<AIQuizQuestion[]> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('topic_id', topicId)
      .eq('ai_generated', true)
      .limit(10);
      
    if (error) {
      logSupabaseError('quiz_sessions', 'select', error);
      return [];
    }

    if (!data) return [];

    return data.map((row: any) => ({
      question: row.question_text || row.question || '',
      options: row.options || [],
      correctIndex: row.correct_index ?? 0,
      explanation: row.explanation || ''
    })).filter(q => q.question && q.options.length === 4);
  } catch (err) {
    console.error('[DB CACHE FETCH ERROR]', err);
    return [];
  }
};

export const getQuizBatch = async ({
  topicId,
  topicTitle,
  subjectId,
  difficulty,
  count = 5
}: {
  topicId: string;
  topicTitle: string;
  subjectId: string;
  difficulty: string;
  count?: number;
}): Promise<AIQuizQuestion[]> => {
  const key = getCacheKey({ topicTitle, difficulty });

  // 1. Try local cache
  const cached = getCachedQuiz(key);
  if (cached.length > 0) {
    console.log('[QUIZ CACHE HIT]');
    return cached;
  }

  // 2. Try DB cache
  if (topicId) {
    const dbCached = await fetchCachedFromDB(topicId);
    if (dbCached.length > 0) {
      console.log('[DB CACHE HIT]');
      setCachedQuiz(key, dbCached);
      return dbCached;
    }
  }

  // 3. Generate new batch
  console.log('[QUIZ BATCH] Generating new questions for', topicTitle);
  const generated = await generateAIQuizBatch({
    topicTitle,
    subjectId,
    difficulty,
    count
  });

  if (generated.length > 0) {
    setCachedQuiz(key, generated);

    // persist
    if (topicId) {
      const supabase = getSupabaseClient();
      try {
        const user = await getAuthenticatedUser();
        
        await Promise.all(
          generated.map((q) =>
            supabase.from('quiz_sessions').insert({
              user_id: user.id,
              subject_id: subjectId,
              topic_id: topicId,
              question_text: q.question,
              options: q.options,
              correct_index: q.correctIndex,
              explanation: q.explanation,
              ai_generated: true,
              score: 0,
              total: 1
            })
          )
        );
      } catch (e) {
        console.warn('[FALLBACK] Could not persist generated questions', e);
      }
    }
    
    return generated;
  } else {
    console.warn('[FALLBACK] Failed to generate AI batch, returning single static');
    return [getStaticQuestion(topicTitle)];
  }
};

export const preloadNextBatch = (params: {
  topicId: string;
  topicTitle: string;
  subjectId: string;
  difficulty: string;
  count?: number;
}) => {
  setTimeout(() => {
    getQuizBatch(params).catch(() => {});
  }, 0);
};
