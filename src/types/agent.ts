/**
 * Agent-related type definitions for the AgentWatch protocol.
 */

import type { Timestamp, Uuid, SemanticVersion } from "./common.js";

/** Unique identifier for an agent instance. */
export type AgentId = Uuid;

/** Possible lifecycle states of an agent. */
export type AgentStatus = "active" | "idle" | "error" | "terminated";

/** A named capability that an agent supports (e.g. "tool:search"). */
export type AgentCapability = string;

/** Descriptive metadata about an agent, supplied at registration time. */
export interface AgentMetadata {
  /** Human-readable display name. */
  name: string;
  /** Version of the agent software. */
  version: SemanticVersion;
  /** Optional description of the agent's purpose. */
  description?: string;
  /** List of capability identifiers the agent exposes. */
  capabilities: AgentCapability[];
  /** Arbitrary key/value tags for filtering or grouping. */
  tags?: Record<string, string>;
}

/** Full agent record combining its identifier, metadata, and current status. */
export interface AgentInfo {
  /** Unique agent identifier. */
  id: AgentId;
  /** Agent descriptive metadata. */
  metadata: AgentMetadata;
  /** Current lifecycle status. */
  status: AgentStatus;
  /** ISO 8601 timestamp when the agent was first registered. */
  registeredAt: Timestamp;
  /** ISO 8601 timestamp of the most recent status change. */
  updatedAt: Timestamp;
}
