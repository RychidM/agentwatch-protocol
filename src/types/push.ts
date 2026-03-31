/**
 * PushPayload — Relay envelope for encrypted messages
 */

export type PushPayloadType =
  | "approval_request"
  | "session_start"
  | "session_end";

export interface PushPayload {
  /** Type of payload being sent */
  type: PushPayloadType;

  /** Session ID (if applicable) */
  sessionId?: string;

  /** Pairing ID for routing */
  pairingId: string;

  /** Encrypted message blob (base64 encoded) */
  encryptedBlob: string;
}
