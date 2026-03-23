/**
 * PushPayload — Relay envelope for encrypted messages
 */

export type PushPayloadType =
  | "session_start"
  | "activity_update"
  | "approval_request"
  | "approval_sync"
  | "session_end";

export interface PushPayload {
  /** Type of payload being sent */
  type: PushPayloadType;

  /** Session ID for routing. */
  sessionId: string;

  /** Pairing ID for routing */
  pairingId: string;

  /** Encrypted message blob (base64 encoded) */
  encryptedBlob: string;
}

export type ActionResponseStatus = "pushed" | "disconnected";

export interface ActionResponse {
  /** Push delivery outcome returned by relay POST /action. */
  status: ActionResponseStatus;
}
