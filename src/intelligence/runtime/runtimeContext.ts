import { PortalType } from '../../types/canonical';
import {
  GovernedRetrievalContext,
  assertPortalType,
  assertRetrievalContext,
  portalNamespaceFor,
} from '../../infrastructure/database';
import { SYSTEM_CONFIG } from '../../config/registry';

export type ConnectivityState = 'online' | 'offline' | 'degraded';
export type AIExecutionMode = 'cache' | 'local' | 'cloud' | 'hybrid';
export type CachePolicyMode = 'prefer-cache' | 'refresh' | 'bypass';

export interface MasteryState {
  score: number;
  attempts: number;
  last_activity?: string;
  weak_points: readonly string[];
}

export interface CachePolicy {
  mode: CachePolicyMode;
  ttlSeconds: number;
}

export interface RuntimeContext {
  user_id: string;
  portal_type: PortalType;
  school_id?: string;
  department_id?: string;
  subject_id: string;
  topic_id: string;
  canonical_id: string;
  mastery_state: MasteryState;
  learning_goal: string;
  connectivity_state: ConnectivityState;
  ai_execution_mode: AIExecutionMode;
  cache_policy: CachePolicy;
  retrieval_policy: GovernedRetrievalContext;
}

export interface RuntimeContextInput {
  user_id: string;
  portal_type: PortalType;
  school_id?: string;
  department_id?: string;
  subject_id: string;
  topic_id: string;
  canonical_id?: string;
  mastery_state?: Partial<MasteryState>;
  learning_goal: string;
  connectivity_state?: ConnectivityState;
  ai_execution_mode?: AIExecutionMode;
  cache_policy?: Partial<CachePolicy>;
}

const canonicalPrefixFor = (portalType: PortalType): string => {
  if (portalType === 'high_school') return 'HS';
  if (portalType === 'university') return 'UNI';
  return 'KE';
};

export const buildCanonicalId = (input: {
  portalType: PortalType;
  subjectId: string;
  topicId: string;
}): string => {
  const prefix = canonicalPrefixFor(input.portalType);
  const subject = input.subjectId.replace(/[^a-z0-9]+/gi, '-').toUpperCase();
  const topic = input.topicId.replace(/[^a-z0-9]+/gi, '-').toUpperCase();
  return `${prefix}-${subject}-${topic}`;
};

export const createRuntimeContext = (input: RuntimeContextInput): RuntimeContext => {
  const portalType = assertPortalType(input.portal_type);
  const canonicalId = input.canonical_id ?? buildCanonicalId({
    portalType,
    subjectId: input.subject_id,
    topicId: input.topic_id,
  });

  const masteryState: MasteryState = {
    score: input.mastery_state?.score ?? 0,
    attempts: input.mastery_state?.attempts ?? 0,
    last_activity: input.mastery_state?.last_activity,
    weak_points: input.mastery_state?.weak_points ?? [],
  };

  const curriculumScope = portalType === 'high_school'
    ? 'KICD_KCSE'
    : portalType === 'university'
      ? 'HEB_UNIV'
      : 'GLOBAL_OPEN';
  const activePath = [
    input.school_id,
    input.department_id,
    input.subject_id,
    input.topic_id,
  ].filter((item): item is string => Boolean(item));

  const retrievalPolicy = assertRetrievalContext({
    portal_type: portalType,
    curriculum_scope: curriculumScope,
    taxonomy_scope: input.subject_id,
    school_scope: input.school_id,
    mastery_level: masteryState.score,
    user_goal: input.learning_goal,
    active_path: activePath.length > 0 ? activePath : [canonicalId],
    user_context: input.user_id,
    limit: SYSTEM_CONFIG.RETRIEVAL.DEFAULT_LIMIT,
  });

  return {
    user_id: input.user_id,
    portal_type: portalType,
    school_id: input.school_id,
    department_id: input.department_id,
    subject_id: input.subject_id,
    topic_id: input.topic_id,
    canonical_id: canonicalId,
    mastery_state: masteryState,
    learning_goal: input.learning_goal,
    connectivity_state: input.connectivity_state ?? 'online',
    ai_execution_mode: input.ai_execution_mode ?? 'hybrid',
    cache_policy: {
      mode: input.cache_policy?.mode ?? 'prefer-cache',
      ttlSeconds: input.cache_policy?.ttlSeconds ?? SYSTEM_CONFIG.CACHE.TTL_SECONDS,
    },
    retrieval_policy: {
      ...retrievalPolicy,
      taxonomy_scope: retrievalPolicy.taxonomy_scope ?? input.subject_id,
      active_path: retrievalPolicy.active_path.length > 0
        ? retrievalPolicy.active_path
        : [portalNamespaceFor(portalType), canonicalId],
    },
  };
};
