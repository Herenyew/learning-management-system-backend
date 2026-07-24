export interface EventEnvelope<T> {
  eventId: string;
  eventType: string;
  source: string;
  version: number;
  occurredAt: string;
  payload: T;
}