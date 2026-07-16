import type { PlatformEventManifest } from "@/lib/platform/events/event-manifest";

export class PlatformEventValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

function inferPayloadType(value: unknown) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const valueType = typeof value;
  if (valueType === "string" || valueType === "number" || valueType === "boolean") return valueType;
  if (valueType === "object") return "object";
  return "unknown";
}

export function validateEventPayload(manifest: PlatformEventManifest, payload: Record<string, unknown>) {
  Object.entries(manifest.payloadSchema).forEach(([key, expectedType]) => {
    if (expectedType === "unknown") return;
    if (!Object.prototype.hasOwnProperty.call(payload, key)) {
      throw new PlatformEventValidationError(`Event ${manifest.eventId} is missing payload field ${key}.`, "EVENT_PAYLOAD_MISSING_FIELD");
    }
    const actualType = inferPayloadType(payload[key]);
    if (actualType !== expectedType) {
      throw new PlatformEventValidationError(`Event ${manifest.eventId} payload field ${key} must be ${expectedType}.`, "EVENT_PAYLOAD_INVALID_TYPE");
    }
  });
  return true;
}
