import { PortalType, RetrievalContext } from "../types/canonical";
import { useRoadmapStore } from "../../store/roadmapStore";
import { normalizePortalType } from "./database/portalFilters";

/**
 * PORTAL CONTEXT RESOLVER
 * 
 * Mandated middleware for resolving the active educational ecosystem.
 * Prevents cross-contamination between portals.
 */

export class PortalContextResolver {
  /**
   * Resolves the current context from state or overrides.
   */
  static resolve(): RetrievalContext {
    const state = useRoadmapStore.getState();
    const activeMode = normalizePortalType(state.learningMode);

    if (!activeMode) {
      throw new Error('[GOVERNANCE ERROR] No active portal context resolved.');
    }

    return {
      portal_type: activeMode,
      curriculum_scope: this.getCurriculumScope(activeMode),
      knowledge_scope: this.getKnowledgeScope(activeMode),
      user_context: state.userId
    };
  }

  private static getCurriculumScope(mode: PortalType): string {
    switch (mode) {
      case 'high_school': return 'KICD_KCSE';
      case 'university': return 'HEB_UNIV';
      case 'knowledge_explorer': return 'GLOBAL_OPEN';
      default: return 'NONE';
    }
  }

  private static getKnowledgeScope(mode: PortalType): string {
    // Isolated namespaces for vector retrieval
    return `namespace:${mode}`;
  }
}

/**
 * Mandated Query Filter Generator
 */
export const getPortalFilter = (context: RetrievalContext) => {
  return {
    portal_type: context.portal_type,
    scope: context.curriculum_scope || context.knowledge_scope
  };
};
