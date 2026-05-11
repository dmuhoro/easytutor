import AsyncStorage from '@react-native-async-storage/async-storage';

export type LogType = 'INFO' | 'WARN' | 'ERROR' | 'SYNC';

export type AppLogEvent = {
  id: string;
  type: LogType;
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
  sessionId: string;
  userId?: string;
};

const STORAGE_KEY = 'easytutor_app_logs_v2';
const MAX_LOGS = 500;

let sessionId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
let userId: string | undefined;

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function setLogContext(ctx: { userId?: string | null; sessionId?: string }): void {
  if (typeof ctx.sessionId === 'string') sessionId = ctx.sessionId;
  if (ctx.userId === null) userId = undefined;
  else if (typeof ctx.userId === 'string') userId = ctx.userId;
}

/**
 * Structured error logging for Supabase and other API errors
 * Provides consistent error format with message, code, details, hint, and stack
 */
export const logError = (context: string, error: any): void => {
  const errorInfo = {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    stack: error?.stack,
    // Additional Supabase-specific fields
    status: error?.status,
    statusText: error?.statusText,
  };
  
  console.error(`[ERROR] [${context}]`, errorInfo);
  
  // Also log to our event system for persistence
  void logEvent('ERROR', context, errorInfo);
};

export async function logEvent(type: LogType, message: string, metadata?: Record<string, any>): Promise<void> {
  const safeMetadata = sanitizeForJson(metadata);
  const event: AppLogEvent = {
    id: makeId(),
    type,
    message,
    metadata: safeMetadata,
    timestamp: new Date().toISOString(),
    sessionId,
    userId,
  };

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const existing: AppLogEvent[] = raw ? JSON.parse(raw) : [];
    // FIFO cleanup (cap)
    const next = [...existing, event].slice(-MAX_LOGS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    if (__DEV__) {
      console.warn('[LOG] Failed to persist log event', err);
    }
  }

  if (__DEV__) {
    const prefix = `[${type}]`;
    if (type === 'ERROR') console.error(prefix, message, metadata ?? '');
    else if (type === 'WARN') console.warn(prefix, message, metadata ?? '');
    else console.log(prefix, message, metadata ?? '');
  }
}

function sanitizeForJson(value: any, seen = new WeakSet<object>()): any {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForJson(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, sanitizeForJson(item, seen)]),
  );
}

export async function getLogs(filter?: { type?: LogType }): Promise<AppLogEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const events: AppLogEvent[] = raw ? JSON.parse(raw) : [];
    if (filter?.type) return events.filter((e) => e.type === filter.type);
    return events;
  } catch {
    return [];
  }
}

export async function dumpLogs(): Promise<AppLogEvent[]> {
  return getLogs();
}

export async function clearLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
