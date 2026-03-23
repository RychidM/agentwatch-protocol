/**
 * Validation utilities using JSON schemas
 */

import type { AnySchema } from "ajv";
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

// Import all schemas
import actionSchema from "./schemas/action.schema.json";
import approvalSchema from "./schemas/approval.schema.json";
import hookSchema from "./schemas/hook.schema.json";
import pushSchema from "./schemas/push.schema.json";
import registrationSchema from "./schemas/registration.schema.json";
import sessionSchema from "./schemas/session.schema.json";

// Import types
import { AgentAction, ResolvedBy } from "./types/action";
import { ApprovalRequest, ApprovalResponse } from "./types/approval";
import { HookInput, HookOutput } from "./types/hook";
import { ActionResponse, PushPayload } from "./types/push";
import { DeviceRegistration } from "./types/registration";
import { Session, SessionStatus } from "./types/session";

interface SchemaWithDefs {
  $defs?: Record<string, AnySchema>;
}

function getDef(schema: unknown, key: string): AnySchema {
  const defs = (schema as SchemaWithDefs).$defs;
  if (!defs || !(key in defs)) {
    throw new Error(`Missing schema definition: ${key}`);
  }
  return defs[key] as AnySchema;
}

// Initialize Ajv with strict mode
const ajv = new Ajv({
  strict: true,
  allErrors: true,
  schemas: [
    sessionSchema,
    actionSchema,
    approvalSchema,
    pushSchema,
    registrationSchema,
    hookSchema,
  ],
});

// Add format validators
addFormats(ajv);

// Create typed validators
const sessionValidator = ajv.compile(
  sessionSchema,
) as ValidateFunction<Session>;
const agentActionValidator = ajv.compile(
  getDef(actionSchema, "AgentAction"),
) as ValidateFunction<AgentAction>;
const resolvedByValidator = ajv.compile(
  getDef(actionSchema, "ResolvedBy"),
) as ValidateFunction<ResolvedBy>;
const approvalRequestValidator = ajv.compile(
  getDef(approvalSchema, "ApprovalRequest"),
) as ValidateFunction<ApprovalRequest>;
const approvalResponseValidator = ajv.compile(
  getDef(approvalSchema, "ApprovalResponse"),
) as ValidateFunction<ApprovalResponse>;
const pushPayloadValidator = ajv.compile(
  getDef(pushSchema, "PushPayload"),
) as ValidateFunction<PushPayload>;
const actionResponseValidator = ajv.compile(
  getDef(pushSchema, "ActionResponse"),
) as ValidateFunction<ActionResponse>;
const registrationValidator = ajv.compile(
  registrationSchema,
) as ValidateFunction<DeviceRegistration>;
const hookInputValidator = ajv.compile(
  getDef(hookSchema, "HookInput"),
) as ValidateFunction<HookInput>;
const hookOutputValidator = ajv.compile(
  getDef(hookSchema, "HookOutput"),
) as ValidateFunction<HookOutput>;
const sessionStatusValidator = ajv.compile({
  type: "string",
  enum: ["active", "idle", "ended"],
}) as ValidateFunction<SessionStatus>;

/** Validation result with typed data or error details */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Array<{ field: string; message: string }> };

/** Format Ajv errors for better readability */
function formatErrors(
  validator: ValidateFunction,
): Array<{ field: string; message: string }> {
  if (!validator.errors)
    return [{ field: "unknown", message: "Validation failed" }];

  return validator.errors.map((err) => ({
    field: err.instancePath || err.schemaPath,
    message: err.message || "Validation error",
  }));
}

/** Generic validate function wrapper */
function createValidator<T>(validator: ValidateFunction<T>) {
  return (data: unknown): ValidationResult<T> => {
    if (validator(data)) {
      return { success: true, data: data as T };
    }
    return { success: false, errors: formatErrors(validator) };
  };
}

export const validateSession = createValidator(sessionValidator);
export const validateSessionStatus = createValidator(sessionStatusValidator);
export const validateAgentAction = createValidator(agentActionValidator);
export const validateResolvedBy = createValidator(resolvedByValidator);
export const validateApprovalRequest = createValidator(
  approvalRequestValidator,
);
export const validateApprovalResponse = createValidator(
  approvalResponseValidator,
);
export const validatePushPayload = createValidator(pushPayloadValidator);
export const validateActionResponse = createValidator(actionResponseValidator);
export const validateDeviceRegistration = createValidator(
  registrationValidator,
);
export const validateHookInput = createValidator(hookInputValidator);
export const validateHookOutput = createValidator(hookOutputValidator);

// Grouped export for ergonomic usage.
export const validate = {
  session: validateSession,
  sessionStatus: validateSessionStatus,
  agentAction: validateAgentAction,
  resolvedBy: validateResolvedBy,
  approvalRequest: validateApprovalRequest,
  approvalResponse: validateApprovalResponse,
  pushPayload: validatePushPayload,
  actionResponse: validateActionResponse,
  deviceRegistration: validateDeviceRegistration,
  hookInput: validateHookInput,
  hookOutput: validateHookOutput,
};
