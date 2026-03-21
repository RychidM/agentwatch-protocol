/**
 * Message (envelope) type definitions for the AgentWatch protocol.
 *
 * Messages are the transport-level wrappers used to carry requests, responses,
 * and push notifications between protocol participants.
 */

import type { Timestamp, Uuid, ProtocolVersion } from "./common.js";
import type { AgentEvent } from "./events.js";

/** Discriminant string literals for all top-level message types. */
export type MessageType = "request" | "response" | "notification";

/** Fields common to every message. */
export interface BaseMessage {
  /** Unique message identifier. */
  messageId: Uuid;
  /** Discriminant field that identifies the concrete message shape. */
  type: MessageType;
  /** Protocol version used by the sender. */
  protocolVersion: ProtocolVersion;
  /** ISO 8601 timestamp when the message was created. */
  sentAt: Timestamp;
}

/** A request sent from a client to the AgentWatch observer. */
export interface RequestMessage extends BaseMessage {
  type: "request";
  /** Identifier used to correlate the response. */
  correlationId: Uuid;
  /** The action the sender wants performed. */
  action: string;
  /** Action-specific payload. */
  payload?: Record<string, unknown>;
}

/** Outcome of processing a RequestMessage. */
export type ResponseStatus = "ok" | "error";

/** A response returned from the observer in reply to a RequestMessage. */
export interface ResponseMessage extends BaseMessage {
  type: "response";
  /** Matches the correlationId of the originating request. */
  correlationId: Uuid;
  /** Indicates whether the request succeeded. */
  status: ResponseStatus;
  /** Response body on success. */
  result?: Record<string, unknown>;
  /** Error detail on failure. */
  error?: {
    code: string;
    message: string;
  };
}

/** A push notification carrying one or more agent events. */
export interface NotificationMessage extends BaseMessage {
  type: "notification";
  /** One or more events bundled in this notification. */
  events: AgentEvent[];
}

/** Discriminated union of all concrete message types. */
export type Message = RequestMessage | ResponseMessage | NotificationMessage;
