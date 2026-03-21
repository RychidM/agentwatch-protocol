/**
 * @agentwatch/protocol
 * 
 * Single authoritative definition of every message type in the AgentWatch protocol.
 * TypeScript components import types and validators at compile time and runtime.
 */

// Export all types
export * from './types/session';
export * from './types/action';
export * from './types/approval';
export * from './types/push';
export * from './types/registration';
export * from './types/hook';
export * from './types/subscription';

// Export validators
export { validate, ValidationResult } from './validators';

