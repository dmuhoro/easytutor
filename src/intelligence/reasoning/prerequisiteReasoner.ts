import { RetrievalContext, PortalType } from '../../types/canonical';
import { LearningHistoryGraph } from '../memory/learningHistoryGraph';

export class PrerequisiteReasoner {
  static analyze(context: RetrievalContext): string[] {
    const knownSteps = context.active_path ?? [];
    const missing: string[] = [];

    for (const step of knownSteps) {
      const prerequisites = LearningHistoryGraph.getPrerequisites(step).map((edge) => edge.from);
      for (const prerequisite of prerequisites) {
        if (!knownSteps.includes(prerequisite)) {
          missing.push(prerequisite);
        }
      }
    }

    return Array.from(new Set(missing));
  }

  static recommendedNext(context: RetrievalContext): string[] {
    return this.analyze(context).slice(0, 3);
  }
}
