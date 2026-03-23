/**
 * AgentAction — A single agent tool call
 */

export type ActionTier = "observe" | "approval";

export type ResolvedBy =
  | "phone"
  | "ide"
  | "ide_limit_fallback"
  | "ide_disconnected"
  | "timeout";

export interface ApprovalContextAction {
  /** Previous action tool name shown for context. */
  toolName: string;

  /** Previous action summary shown for context. */
  summary: string;
}

export interface AgentAction {
  /** Unique action identifier */
  id: string;

  /** Session this action belongs to */
  sessionId: string;

  /** Tool name (e.g., "read_file", "run_in_terminal") */
  toolName: string;

  /** Tool input parameters as JSON object */
  input: Record<string, unknown>;

  /** Human-readable summary of the action */
  summary: string;

  /** Action tier (observe/approval). */
  tier: ActionTier;

  /** True when daemon sanitization detected non-ASCII content in args. */
  hasNonAsciiWarning: boolean;

  /** ISO 8601 timestamp when action was requested */
  timestamp: string;
}
