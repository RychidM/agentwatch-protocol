/**
 * Event type definitions for the AgentWatch protocol.
 *
 * Events are emitted by agents to report lifecycle changes and observations.
 * Every event extends BaseEvent which carries common envelope fields.
 */

import type { Timestamp, Uuid } from "./common.js";
import type { AgentId, AgentMetadata, AgentStatus } from "./agent.js";

/** Discriminant string literals for all event types. */
export type EventType =
  | "agent.registered"
  | "agent.started"
  | "agent.stopped"
  | "agent.heartbeat"
  | "agent.error"
  | "agent.log";

/** Common fields present on every event. */
export interface BaseEvent {
  /** Unique event identifier. */
  eventId: Uuid;
  /** Discriminant field that identifies the concrete event shape. */
  type: EventType;
  /** Identifier of the agent that emitted the event. */
  agentId: AgentId;
  /** ISO 8601 timestamp when the event occurred. */
  occurredAt: Timestamp;
}

/** Emitted when an agent registers itself with the system for the first time. */
export interface AgentRegisteredEvent extends BaseEvent {
  type: "agent.registered";
  metadata: AgentMetadata;
}

/** Emitted when an agent transitions to the "active" status. */
export interface AgentStartedEvent extends BaseEvent {
  type: "agent.started";
}

/** Emitted when an agent shuts down. */
export interface AgentStoppedEvent extends BaseEvent {
  type: "agent.stopped";
  /** Optional human-readable reason for the shutdown. */
  reason?: string;
}

/** Periodic liveness signal sent by a running agent. */
export interface AgentHeartbeatEvent extends BaseEvent {
  type: "agent.heartbeat";
  /** Current lifecycle status at the time of the heartbeat. */
  status: AgentStatus;
}

/** Severity levels for error and log events. */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** Emitted when an agent encounters an unrecoverable or notable error. */
export interface AgentErrorEvent extends BaseEvent {
  type: "agent.error";
  /** Short error code or class name. */
  code: string;
  /** Human-readable error message. */
  message: string;
  /** Optional serialised stack trace. */
  stack?: string;
}

/** Emitted by an agent to forward a log entry to the observer. */
export interface AgentLogEvent extends BaseEvent {
  type: "agent.log";
  /** Severity of the log entry. */
  level: LogLevel;
  /** Log message text. */
  message: string;
  /** Optional structured context data. */
  context?: Record<string, unknown>;
}

/** Discriminated union of all concrete event types. */
export type AgentEvent =
  | AgentRegisteredEvent
  | AgentStartedEvent
  | AgentStoppedEvent
  | AgentHeartbeatEvent
  | AgentErrorEvent
  | AgentLogEvent;
