/**
 * ApprovalRequest and ApprovalResponse — Pending decision and user response
 */

import { AgentAction } from "./action";

export interface ApprovalRequest {
  /** Unique approval request identifier */
  approvalId: string;

  /** Session this approval belongs to */
  sessionId: string;

  /** The action requiring approval */
  action: AgentAction;

  /** Previous actions in this session for context */
  precedingActions: AgentAction[];

  /** ISO 8601 timestamp when request expires */
  timeout: string;
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

  /** ISO 8601 timestamp when decision was made */
  requestTimestamp: string;
}
