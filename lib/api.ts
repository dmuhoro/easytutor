import Anthropic from '@anthropic-ai/sdk';
import { useSettingsStore } from '../store/settingsStore';

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

// ─── Internal routing helpers ────────────────────────────────────────────────

async function callOllama(
  systemPrompt: string,
  messages: { role: string; content: string }[],
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
  messages: { role: string; content: string }[],
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
  messages: { role: string; content: string }[],
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
  messages: { role: string; content: string }[],
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
  messages: { role: 'user' | 'assistant'; content: string }[],
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

export async function generateQuizQuestion(
  unit: string,
  topic: string,
): Promise<{ success: true; data: QuizQuestion } | { success: false; error: string }> {
  const systemPrompt =
    'You are a strictly JSON API. Respond ONLY with a raw JSON object with these exact properties: question (string), options (array of 4 strings), correct (zero-indexed number), explanation (string). No markdown, no ```json.';
  const userMessage = `Generate a challenging multiple-choice question for the unit '${unit}' on the topic '${topic}'.`;

  try {
    const outputText = await getAIResponse(
      systemPrompt,
      [{ role: 'user', content: userMessage }],
      true, // request JSON mode for Ollama
    );

    const jsonString = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonString);

    return {
      success: true,
      data: {
        question: parsed.question as string,
        options: parsed.options as string[],
        correct: parsed.correct as number,
        explanation: parsed.explanation as string,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not generate quiz question.';
    console.error('generateQuizQuestion error:', message);
    return { success: false, error: message };
  }
}
