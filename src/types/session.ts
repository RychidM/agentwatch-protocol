/**
 * Session — A single agent conversation
 */

export type SessionStatus = "active" | "idle" | "ended";

export interface Session {
  /** Unique session identifier */
  id: string;

  /** IDE name (e.g., "vscode", "cursor", "windsurf") */
  ide: string;

  /** Current working directory at session start */
  cwd: string;

  /** ISO 8601 timestamp when session started */
  startedAt: string;

  /** ISO 8601 timestamp when session ended (if completed) */
  endedAt?: string;

  /** Current session status */
  status: SessionStatus;
}
