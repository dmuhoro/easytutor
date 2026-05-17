import { PortalType } from '../../types/canonical';

export const PORTAL_TYPES: readonly PortalType[] = [
  'high_school',
  'university',
  'knowledge_explorer',
];

export interface PortalScope {
  portalType: PortalType;
  userId?: string;
}

export const normalizePortalType = (value: string | null | undefined): PortalType => {
  if (value === 'self_directed') return 'knowledge_explorer';
  if (PORTAL_TYPES.includes(value as PortalType)) return value as PortalType;
  throw new Error(`[GOVERNANCE ERROR] Invalid or missing portal_type: ${value ?? 'undefined'}`);
};

export const assertPortalType = (portalType: PortalType | null | undefined): PortalType => {
  if (!portalType || !PORTAL_TYPES.includes(portalType)) {
    throw new Error(`[GOVERNANCE ERROR] Missing mandatory portal_type filter.`);
  }

  return portalType;
};

export const portalNamespaceFor = (portalType: PortalType): string => {
  const portal = assertPortalType(portalType);
  return `portal:${portal}`;
};
