import { RetrievalContext } from '../../types/canonical';

export class ContextExpansionEngine {
  static expand(context: RetrievalContext): RetrievalContext & { active_path: string[] } {
    const activePath = context.active_path ?? [];
    const expandedPath = [...activePath];

    if (context.user_goal && !expandedPath.includes(context.user_goal)) {
      expandedPath.push(context.user_goal);
    }

    return {
      ...context,
      active_path: expandedPath,
    };
  }
}
