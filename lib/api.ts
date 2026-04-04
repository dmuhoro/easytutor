import Anthropic from '@anthropic-ai/sdk';
import { useSettingsStore } from '../store/settingsStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { getSystemPrompt } from '../services/systemPrompts';

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
): Promise<string> {
  const { useLocalLLM, ollamaUrl, ollamaModel } = useSettingsStore.getState();

  if (useLocalLLM) {
    return callOllama(systemPrompt, messages, ollamaUrl, ollamaModel, jsonMode);
  }

  if (checkGroqAvailable()) {
    return callGroq(systemPrompt, messages);
  }

  return callAnthropic(systemPrompt, messages);
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
    console.error('askTutor error:', message);
    return { success: false, error: message };
  }
}

import { RoadmapSchema, QuizQuestionSchema } from './schemas';
import { SUBJECTS } from './subjects';

let isGeneratingRoadmap = false;

export async function generateStudyRoadmap(topic: string, retries = 2): Promise<{ success: boolean; data?: any; error?: string }> {
  if (isGeneratingRoadmap) return { success: false, error: 'A generation is already in progress.' };
  
  isGeneratingRoadmap = true;
  
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
  Be concise and practical. Output ONLY the JSON object. No markdown, no extra text.`;

  try {
    const { learningMode } = useRoadmapStore.getState();
    const basePrompt = getSystemPrompt(learningMode);
    const fullSystemPrompt = `${basePrompt} You are a strictly JSON API.`;
    
    const res = await getAIResponse(fullSystemPrompt, [{ role: 'user', content: prompt }], true);
    
    // Attempt to extract JSON
    const jsonMatch = res.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    
    const parsed = JSON.parse(jsonMatch[0].trim());
    const validation = RoadmapSchema.safeParse(parsed);
    
    if (!validation.success) {
      isGeneratingRoadmap = false;
      if (retries > 0) return generateStudyRoadmap(topic, retries - 1);
      throw new Error(`Validation failed: ${validation.error.message}`);
    }
    
    isGeneratingRoadmap = false;
    return { success: true, data: validation.data };
  } catch (error: any) {
    isGeneratingRoadmap = false;
    console.error('generateStudyRoadmap Error:', error.message);
    if (retries > 0) return generateStudyRoadmap(topic, retries - 1);
    return { success: false, error: error.message };
  }
}


export async function generateQuizQuestion(
  unit: string,
  topic: string,
  retries = 2
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  try {
    const { learningMode } = useRoadmapStore.getState();
    const basePrompt = getSystemPrompt(learningMode);
    const fullSystemPrompt = `${basePrompt} You are a strictly JSON API. Respond ONLY with a raw JSON object with these exact properties: question (string), options (array of 4 strings), correct (zero-indexed number), explanation (string). No markdown, no \`\`\`json.`;
    
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
      if (retries > 0) return generateQuizQuestion(unit, topic, retries - 1);
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    return { success: true, data: validation.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not generate quiz question.';
    if (retries > 0) return generateQuizQuestion(unit, topic, retries - 1);
    console.error('generateQuizQuestion error:', message);
    return { success: false, error: message };
  }
}

