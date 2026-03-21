/**
 * @agentwatch/protocol
 *
 * Single authoritative definition of every message type used in the AgentWatch
 * system. Exports TypeScript types for compile-time safety and JSON Schema
 * objects for runtime validation (no validator logic included — bring your own
 * validator, e.g. ajv, zod, or json-schema).
 */

// ─── Common primitives ───────────────────────────────────────────────────────
export type { Timestamp, Uuid, SemanticVersion, ProtocolVersion } from "./types/common.js";
export { PROTOCOL_VERSION } from "./types/common.js";

// ─── Agent types ─────────────────────────────────────────────────────────────
export type {
  AgentId,
  AgentStatus,
  AgentCapability,
  AgentMetadata,
  AgentInfo,
} from "./types/agent.js";

// ─── Event types ─────────────────────────────────────────────────────────────
export type {
  EventType,
  LogLevel,
  BaseEvent,
  AgentRegisteredEvent,
  AgentStartedEvent,
  AgentStoppedEvent,
  AgentHeartbeatEvent,
  AgentErrorEvent,
  AgentLogEvent,
  AgentEvent,
} from "./types/events.js";

// ─── Message types ────────────────────────────────────────────────────────────
export type {
  MessageType,
  ResponseStatus,
  BaseMessage,
  RequestMessage,
  ResponseMessage,
  NotificationMessage,
  Message,
} from "./types/messages.js";

// ─── JSON Schemas ─────────────────────────────────────────────────────────────
import commonSchema from "./schemas/common.schema.json";
import agentSchema from "./schemas/agent.schema.json";
import eventsSchema from "./schemas/events.schema.json";
import messagesSchema from "./schemas/messages.schema.json";

export { commonSchema, agentSchema, eventsSchema, messagesSchema };
