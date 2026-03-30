/**
 * AgentAction — A single agent tool call
 */

export type ActionTier = "read" | "write" | "run";
export type ActionOutcome = "allowed" | "denied" | "auto_approved";

export interface AutoApprovalRecord {
  /** Reason for auto-approval */
  reason: "limit_reached";

  /** Type of limit that was reached */
  limitType: "daily" | "monthly";

  /** ISO 8601 timestamp when the limit resets */
  resetDate: string;
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

  /** Action tier (read/write/run) */
  tier: ActionTier;

  /** ISO 8601 timestamp when action was requested */
  timestamp: string;

  /** Action outcome - how it was resolved */
  outcome?: ActionOutcome;

  /** Auto-approval details if outcome is auto_approved */
  autoApprovalRecord?: AutoApprovalRecord;
}
