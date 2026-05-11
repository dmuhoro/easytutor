import { AIQuizQuestion } from '../types/quiz';
import { askTutor } from './api';

/**
 * Validates that the AI output matches the strict AIQuizQuestion contract.
 */
export const safeParseQuiz = (raw: string): AIQuizQuestion | null => {
  try {
    // Attempt to extract JSON from markdown if present
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const cleanRaw = jsonMatch ? jsonMatch[0] : raw;
    
    const parsed = JSON.parse(cleanRaw);

    if (
      typeof parsed.question !== 'string' ||
      !Array.isArray(parsed.options) ||
      parsed.options.length !== 4 ||
      typeof parsed.correctIndex !== 'number' ||
      parsed.correctIndex < 0 ||
      parsed.correctIndex > 3 ||
      typeof parsed.explanation !== 'string'
    ) {
      throw new Error('Invalid quiz format');
    }

    return parsed as AIQuizQuestion;
  } catch (err) {
    console.error('[ERROR] [QUIZ PARSE]', err);
    return null;
  }
};

/**
 * Generates a single quiz question using AI.
 */
export const generateAIQuiz = async ({
  topicTitle,
  difficulty,
  subjectId
}: {
  topicTitle: string;
  difficulty: string;
  subjectId: string;
}): Promise<AIQuizQuestion | null> => {
  try {
    const systemPrompt = `You are a professional quiz generator specializing in ${subjectId}. Respond ONLY with raw JSON.`;
    
    const prompt = `
Generate ONE multiple-choice question.

Topic: ${topicTitle}
Subject: ${subjectId}
Difficulty: ${difficulty}

Rules:
- 4 options only
- 1 correct answer
- return JSON ONLY
- no markdown or extra text

Format:
{
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "explanation": "..."
}
`;

    console.log('[AI QUIZ] generating question', { topicTitle, difficulty });
    
    const res = await askTutor(systemPrompt, [{ role: 'user', content: prompt }]);

    if (!res.success || !res.data) {
      console.error('[ERROR] [AI QUIZ] AI call failed', res.error);
      return null;
    }

    return safeParseQuiz(res.data);

  } catch (err) {
    console.error('[ERROR] [AI QUIZ]', err);
    return null;
  }
};

/**
 * Batch generate quiz questions using AI.
 */
export const generateAIQuizBatch = async ({
  topicTitle,
  difficulty,
  subjectId,
  count = 5
}: {
  topicTitle: string;
  difficulty: string;
  subjectId: string;
  count?: number;
}): Promise<AIQuizQuestion[]> => {
  try {
    const systemPrompt = `You are a professional quiz generator specializing in ${subjectId}. Respond ONLY with a valid JSON array of objects.`;

    const prompt = `
Generate ${count} multiple-choice questions.

Topic: ${topicTitle}
Subject: ${subjectId}
Difficulty: ${difficulty}

Rules:
- Each question must have 4 options
- Only 1 correct answer
- Return JSON array ONLY
- No markdown or extra text

Format:
[
  {
    "question": "...",
    "options": ["A","B","C","D"],
    "correctIndex": 0,
    "explanation": "..."
  }
]
`;

    const res = await askTutor(systemPrompt, [{ role: 'user', content: prompt }]);

    if (!res.success || !res.data) {
      console.error('[ERROR] [AI BATCH] AI call failed', res.error);
      return [];
    }

    return safeParseQuizArray(res.data);

  } catch (err) {
    console.error('[AI BATCH ERROR]', err);
    return [];
  }
};

export const safeParseQuizArray = (raw: string): AIQuizQuestion[] => {
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const cleanRaw = jsonMatch ? jsonMatch[0] : raw;
    
    const parsed = JSON.parse(cleanRaw);

    if (!Array.isArray(parsed)) return [];

    return parsed.map((q: any) => safeParseQuiz(JSON.stringify(q))).filter(Boolean) as AIQuizQuestion[];
  } catch (err) {
    console.error('[BATCH PARSE ERROR]', err);
    return [];
  }
};

/**
 * Fetches a quiz question with a fallback mechanism.
 */
export const getQuizQuestion = async (params: {
  topicTitle: string;
  difficulty: string;
  subjectId: string;
}): Promise<AIQuizQuestion> => {
  const aiQuiz = await generateAIQuiz(params);

  if (aiQuiz) {
    console.log('[AI QUIZ] Generated successfully');
    return aiQuiz;
  }

  console.warn('[AI FALLBACK] Using static question');

  return getStaticQuestion(params.topicTitle);
};

/**
 * Deterministic fallback for when AI fails.
 */
export const getStaticQuestion = (topicTitle: string): AIQuizQuestion => {
  return {
    question: `What is a primary concept related to ${topicTitle}?`,
    options: [
      'Core principles and foundations',
      'Unrelated fringe theories',
      'Historical footnotes only',
      'Non-standard interpretations'
    ],
    correctIndex: 0,
    explanation: `This is a foundational concept within ${topicTitle}. (Fallback question used due to AI service unavailability).`
  };
};
