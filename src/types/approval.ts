/**
 * ApprovalRequest and ApprovalResponse — Pending decision and user response
 */

import { AgentAction, ApprovalContextAction } from "./action";

export interface ApprovalRequest {
  /** Unique approval request identifier */
  approvalId: string;

  /** Session this approval belongs to */
  sessionId: string;

  /** The action requiring approval */
  action: AgentAction;

  /** Last three actions for context (tool name + summary only). */
  precedingActions: ApprovalContextAction[];

  /** Time-to-live for this request in milliseconds. */
  timeoutMs: number;

  /** ISO 8601 timestamp when the request was created. */
  timestamp: string;
}

export type ApprovalDecision = "allow" | "deny";

export interface ApprovalResponse {
  /** Approval request ID this response is for */
  approvalId: string;

  /** Session ID */
  sessionId: string;

  /** User's decision */
  decision: ApprovalDecision;

  /** HMAC signature for authenticity verification */
  signature: string;

  /** Original request timestamp for stale detection. */
  requestTimestamp: string;
}
