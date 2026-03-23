/**
 * @agentwatch/protocol
 *
 * Single authoritative definition of every message type in the AgentWatch protocol.
 * TypeScript components import types and validators at compile time and runtime.
 */

// Export all types
export * from "./types/action";
export * from "./types/approval";
export * from "./types/hook";
export * from "./types/push";
export * from "./types/registration";
export * from "./types/session";

// Export validators
export {
  ValidationResult,
  validate,
  validateActionResponse,
  validateAgentAction,
  validateApprovalRequest,
  validateApprovalResponse,
  validateDeviceRegistration,
  validateHookInput,
  validateHookOutput,
  validatePushPayload,
  validateResolvedBy,
  validateSession,
  validateSessionStatus,
} from "./validators";
