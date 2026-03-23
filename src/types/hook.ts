/**
 * HookInput and HookOutput — IDE stdin/stdout payloads for hook script
 */

export type HookEventName =
  | "SessionStart"
  | "PreToolUse"
  | "PostToolUse"
  | "SessionEnd"
  | "userPromptSubmitted"
  | "before_tool";

export type HookSource = "startup" | "resume" | "clear";

export interface HookInput {
  /** Event being reported */
  eventName: HookEventName;

  /** Session ID */
  sessionId: string;

  /** Current working directory */
  cwd: string;

  /** Tool name (for tool_call events) */
  toolName?: string;

  /** Tool input parameters (for tool_call events) */
  toolInput?: Record<string, unknown>;

  /** Source of SessionStart events. */
  source?: HookSource;
}

export type HookDecision = "allow" | "deny";

export interface HookOutput {
  /** Decision for the hook event */
  decision: HookDecision;

  /** Optional reason for denial */
  reason?: string;
}
