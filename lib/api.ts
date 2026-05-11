import Anthropic from '@anthropic-ai/sdk';
import { useSettingsStore } from '../store/settingsStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { buildSystemPrompt } from '../services/systemPrompts';
import { RoadmapSchema, QuizQuestionSchema } from './schemas';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthenticatedUser, getSupabaseClient, logSupabaseError } from './supabaseOps';
import { resolveTopicId } from './resolveTopicId';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Provider detection ──────────────────────────────────────────────────────

export function checkGroqAvailable(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_GROQ_API_KEY);
}

// ─── Shared response type ────────────────────────────────────────────────────

interface AIResponse {
  success: boolean;
  data?: string;
  error?: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export type AIChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// ─── Internal routing helpers ────────────────────────────────────────────────

async function callOllama(
  systemPrompt: string,
  messages: AIChatMessage[],
  ollamaUrl: string,
  ollamaModel: string,
  jsonMode = false,
): Promise<string> {
  const base = ollamaUrl.endsWith('/') ? ollamaUrl : ollamaUrl + '/';
  const endpoint = `${base}api/chat`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: false,
      ...(jsonMode ? { format: 'json' } : {}),
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
  const raw = await res.json();
  return raw.message?.content ?? '';
}

async function callGroq(
  systemPrompt: string,
  messages: AIChatMessage[],
): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.statusText}`);
  const raw = await res.json();
  return raw.choices?.[0]?.message?.content ?? '';
}

function buildAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
    dangerouslyAllowBrowser: true,
  });
}

async function callAnthropic(
  systemPrompt: string,
  messages: AIChatMessage[],
): Promise<string> {
  const client = buildAnthropicClient();
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// ─── Route to the right provider ─────────────────────────────────────────────

async function getAIResponse(
  systemPrompt: string,
  messages: AIChatMessage[],
  jsonMode = false,
  isFallback = false,
  retries = 2
): Promise<string> {
  const { aiMode, ollamaUrl, ollamaModel, customApiKey, customProvider } = useSettingsStore.getState();

  try {
    if (aiMode === 'local' && !isFallback) {
      return await callOllama(systemPrompt, messages, ollamaUrl, ollamaModel, jsonMode);
    }

    if (aiMode === 'custom' && !isFallback) {
      if (customProvider === 'groq') {
         const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${customApiKey}`,
           },
           body: JSON.stringify({
             model: 'llama-3.1-8b-instant',
             messages: [{ role: 'system', content: systemPrompt }, ...messages],
           }),
         });
         if (!res.ok) throw new Error(`Custom Groq error: ${res.statusText}`);
         const raw = await res.json();
         return raw.choices?.[0]?.message?.content ?? '';
      } else {
         const client = new Anthropic({
            apiKey: customApiKey,
            dangerouslyAllowBrowser: true,
         });
         const response = await client.messages.create({
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 1000,
            system: systemPrompt,
            messages,
         });
         return response.content[0].type === 'text' ? response.content[0].text : '';
      }
    }

    if (checkGroqAvailable()) {
      return await callGroq(systemPrompt, messages);
    }

    return await callAnthropic(systemPrompt, messages);
  } catch (error) {
    if (retries > 0) {
      await sleep(1000);
      return getAIResponse(systemPrompt, messages, jsonMode, isFallback, retries - 1);
    }
    
    if (aiMode === 'local' && !isFallback) {
      console.warn('[AI API] Local LLM failed. Falling back to Hosted...');
      return getAIResponse(systemPrompt, messages, jsonMode, true);
    }
    throw error;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function askTutor(
  systemPrompt: string,
  messages: AIChatMessage[],
): Promise<AIResponse> {
  try {
    const data = await getAIResponse(systemPrompt, messages);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    if (__DEV__) {
      console.error('[AI API] askTutor failed:', message);
    }
    return { success: false, error: message };
  }
}

let isGeneratingRoadmap = false;

export async function generateStudyRoadmap(
  topic: string,
  subjectId?: string,
  topicId?: string,
  userId?: string,
  retries = 2,
  opts?: {
    weakFocus?: string[];
    masteredSkip?: string[];
    context?: 'high_school' | 'university' | 'self_directed';
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (isGeneratingRoadmap) return { success: false, error: 'A generation is already in progress.' };
  
  isGeneratingRoadmap = true;
  
  const weak = (opts?.weakFocus ?? []).slice(0, 8);
  const mastered = (opts?.masteredSkip ?? []).slice(0, 8);
  const adaptationBlock =
    weak.length > 0 || mastered.length > 0
      ? `\nPersonalization:\n- Prioritize these weak areas: ${weak.length ? weak.join(', ') : 'none'}\n- Skip or de-emphasize these mastered areas: ${mastered.length ? mastered.join(', ') : 'none'}\n`
      : '';

  const prompt = `Generate a structured 7-day study roadmap for the topic: "${topic}".
  For each day, provide a title and 3-4 specific, actionable study tasks.
  Return the response as a valid JSON object with the following structure:
  {
    "title": "Roadmap Title",
    "days": [
      {
        "day": 1,
        "title": "Day 1 Title",
        "tasks": ["Task 1", "Task 2", "Task 3"]
      },
      ... up to day 7
    ]
  }
  Be concise and practical.${adaptationBlock}
  Output ONLY the JSON object. No markdown, no extra text.`;

  try {
    const { learningMode } = useRoadmapStore.getState();
    const fullSystemPrompt = buildSystemPrompt({
      mode: learningMode,
      topic,
      subject: subjectId
    }) + "\nSTRICT RULE: You are a JSON API. Respond ONLY with raw JSON.";
    
    const res = await getAIResponse(fullSystemPrompt, [{ role: 'user', content: prompt }], true);
    
    const jsonMatch = res.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    
    const parsed = JSON.parse(jsonMatch[0].trim());
    const validation = RoadmapSchema.safeParse(parsed);
    
    if (!validation.success) {
      if (retries > 0) {
        isGeneratingRoadmap = false; // Allow retry to set it again
        await sleep(1000);
        return generateStudyRoadmap(topic, subjectId, topicId, userId, retries - 1);
      }
      throw new Error(`Validation failed: ${validation.error.message}`);
    }
    
    isGeneratingRoadmap = false;

    if (userId && subjectId && topicId) {
      const client = getSupabaseClient();
      const user = await getAuthenticatedUser();
      const resolvedTopicId = await resolveTopicId(topicId || topic, subjectId);
      if (!resolvedTopicId) {
        throw new Error('[FATAL] topic_id resolution failed');
      }
      const { error } = await client.from('cached_roadmaps').upsert({
        user_id: user.id,
        subject_id: subjectId,
        topic_id: resolvedTopicId,
        roadmap_json: validation.data
      }, { onConflict: 'user_id,topic_id' });
      if (error) {
        logSupabaseError('cached_roadmaps', 'upsert', error);
        throw error;
      }
    }

    return { success: true, data: validation.data };
  } catch (error: any) {
    isGeneratingRoadmap = false;
    if (retries > 0) {
      await sleep(1000);
      return generateStudyRoadmap(topic, subjectId, topicId, userId, retries - 1);
    }
    return { success: false, error: error.message };
  }
}

export async function generateQuizQuestion(
  unit: string,
  topic: string,
  retries = 2
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  const cacheKey = `easytutor_quiz_cache_v1:${unit}:${topic}`;
  try {
    const { learningMode } = useRoadmapStore.getState();
    const fullSystemPrompt = buildSystemPrompt({
      mode: learningMode,
      topic,
      subject: unit,
      isQuiz: true
    }) + "\nSTRICT RULE: Respond ONLY with a raw JSON object with these exact properties: question (string), options (array of 4 strings), correct (zero-indexed number), explanation (string). No markdown, no extra text.";
    
    const userMessage = `Generate a challenging multiple-choice question for the unit '${unit}' on the topic '${topic}'.`;

    const outputText = await getAIResponse(
      fullSystemPrompt,
      [{ role: 'user', content: userMessage }],
      true, 
    );

    const jsonString = outputText.match(/\{[\s\S]*\}/)?.[0] ?? outputText;
    const parsed = JSON.parse(jsonString.trim());
    const validation = QuizQuestionSchema.safeParse(parsed);
    
    if (!validation.success) {
      if (retries > 0) {
        await sleep(1000);
        return generateQuizQuestion(unit, topic, retries - 1);
      }
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    // Cache successful question locally for offline use.
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      const existing: any[] = raw ? JSON.parse(raw) : [];
      const next = [...existing, validation.data].slice(-50);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(next));
    } catch {
      // never crash
    }

    return { success: true, data: validation.data };
  } catch (error: unknown) {
    if (retries > 0) {
      await sleep(1000);
      return generateQuizQuestion(unit, topic, retries - 1);
    }
    // Offline-first fallback: serve cached questions if available.
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      const cached: any[] = raw ? JSON.parse(raw) : [];
      if (cached.length > 0) {
        const pick = cached[Math.floor(Math.random() * cached.length)];
        return { success: true, data: pick };
      }
    } catch {
      // ignore
    }

    // Final fallback: deterministic placeholder (never block the quiz UI completely).
    const message = error instanceof Error ? error.message : 'Could not generate quiz question.';
    return {
      success: true,
      data: {
        question: `Offline practice: Which statement best describes "${topic}" in "${unit}"?`,
        options: [
          'It is a core concept in this topic.',
          'It is unrelated to this topic.',
          'It is only used in advanced cases.',
          'It is not part of the syllabus.',
        ],
        correct: 0,
        explanation: `You are in offline mode or the AI service failed (${message}). This is a placeholder question—retry later for generated questions.`,
      },
    };
  }
}
