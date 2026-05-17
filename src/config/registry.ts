/**
 * CENTRAL CONFIG REGISTRY
 * 
 * Centralized authority for all system thresholds, timeouts, and constants.
 * No hardcoded magic values allowed across the codebase.
 */

import { PortalType } from "../types/canonical";

export const SYSTEM_CONFIG = {
  AI: {
    DEFAULT_TIMEOUT_MS: 15000,
    RETRY_ATTEMPTS: 3,
    ROUTING: {
      PREFER_LOCAL: true,
      LOCAL_URL: 'http://localhost:11434',
      DEFAULT_MODEL: 'llama3.2',
    }
  },
  
  MASTERY: {
    THRESHOLDS: {
      BEGINNER: 0,
      EXPLORER: 100,
      SCHOLAR: 300,
      ADVANCED: 600,
      EXPERT: 1000,
    },
    PASSING_SCORE: 80, // Percentage
    DECAY_RATE: 0.05, // Daily mastery decay
  },
  
  PORTALS: {
    high_school: {
      enabled: true,
      theme_color: '#3b82f6',
      id_prefix: 'HS',
    },
    university: {
      enabled: true,
      theme_color: '#a855f7',
      id_prefix: 'UNI',
    },
    knowledge_explorer: {
      enabled: true,
      theme_color: '#22c55e',
      id_prefix: 'KE',
    }
  },
  
  RETRIEVAL: {
    DEFAULT_LIMIT: 5,
    MIN_SIMILARITY: 0.7,
  },
  
  SYNC: {
    BATCH_SIZE: 20,
    POLLING_INTERVAL_MS: 30000,
  },
  
  CACHE: {
    TTL_SECONDS: 3600 * 24, // 24 hours
  }
};
