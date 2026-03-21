/**
 * Common primitive types shared across the AgentWatch protocol.
 */

/** ISO 8601 datetime string (e.g. "2026-03-21T11:00:00.000Z"). */
export type Timestamp = string;

/** RFC 4122 UUID string. */
export type Uuid = string;

/** Semantic version string (e.g. "1.0.0"). */
export type SemanticVersion = string;

/** Protocol version supported by this package. */
export const PROTOCOL_VERSION = "0.1.0" as const;
export type ProtocolVersion = typeof PROTOCOL_VERSION;
