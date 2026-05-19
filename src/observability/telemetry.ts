import { TelemetryEvent, TelemetryEventType } from "../types/canonical";
import { logEvent } from "../../lib/logEvent";
import { PortalContextResolver } from "../infrastructure/contextResolver";
import { PortalType } from "../types/canonical";

/**
 * OBSERVABILITY ENGINE
 * 
 * Centralized telemetry for system-wide auditing and performance tracking.
 */

export class Telemetry {
  static emit(params: {
    event: TelemetryEventType;
    source: TelemetryEvent['source_layer'];
    contentId?: string;
    canonicalId?: string;
    userId?: string;
    portalType?: PortalType;
    latency?: number;
    operationType?: string;
    payload?: Record<string, unknown>;
  }): void {
    let context;
    try {
      context = params.portalType && params.userId
        ? { portal_type: params.portalType, user_context: params.userId }
        : PortalContextResolver.resolve();
    } catch (err) {
      context = { portal_type: params.portalType || 'high_school' as any, user_context: params.userId || 'ANONYMOUS' };
    }
    
    const event: TelemetryEvent = {
      event_type: params.event,
      timestamp: new Date().toISOString(),
      user_id: context.user_context || 'ANONYMOUS',
      portal_type: context.portal_type,
      content_id: params.contentId,
      canonical_id: params.canonicalId ?? params.contentId,
      latency: params.latency,
      operation_type: params.operationType ?? params.event,
      source_layer: params.source,
      payload: params.payload
    };

    // Log to console for dev visibility
    console.log(`[TELEMETRY] [${event.event_type}]`, event);

    // Forward to existing logEvent utility
    void logEvent('INFO', event.event_type, event);
    
    // In production, this would also push to a dedicated telemetry table in Supabase
    this.persistToCloud(event);
  }

  private static async persistToCloud(_event: TelemetryEvent): Promise<void> {
    // Background persistence to 'system_telemetry' table
    try {
      // Cloud persistence is intentionally deferred to the governed telemetry writer.
    } catch (err) {
      console.warn('[TELEMETRY] [FAIL] Persistence failed', err);
    }
  }
}
