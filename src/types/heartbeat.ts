/**
 * SessionHeartbeat — Keep-alive signal for an active session
 */

export interface SessionHeartbeat {
  /** Session to keep alive — maxLength 128 */
  sessionId: string;
}
