import { PortalType } from '../../types/canonical';
import { PortalContextResolver } from '../../infrastructure/contextResolver';

export interface DependencyEdge {
  from: string;
  to: string;
  relationship: 'prerequisite' | 'supports' | 'reinforces';
}

const defaultGraph: DependencyEdge[] = [
  { from: 'HS-MATH-ALG', to: 'HS-MATH-CALC', relationship: 'prerequisite' },
  { from: 'HS-MATH-ALG', to: 'HS-MATH-ALG-ADV', relationship: 'supports' },
  { from: 'UNI-COMP-CS-BSC-DSA', to: 'UNI-COMP-CS-BSC-ALG', relationship: 'prerequisite' },
];

export class LearningHistoryGraph {
  static getDependencies(): DependencyEdge[] {
    const context = PortalContextResolver.resolve();
    return defaultGraph.filter((edge) => edge.from.startsWith(context.portal_type === 'high_school' ? 'HS' : context.portal_type === 'university' ? 'UNI' : 'KE'));
  }

  static getPrerequisites(nodeId: string): DependencyEdge[] {
    return this.getDependencies().filter((edge) => edge.to === nodeId && edge.relationship === 'prerequisite');
  }

  static getRelated(nodeId: string): DependencyEdge[] {
    return this.getDependencies().filter((edge) => edge.from === nodeId || edge.to === nodeId);
  }
}
