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
import subscriptionStatusSchema from "./schemas/subscription-status.schema.json";
import entitlementRequestSchema from "./schemas/entitlement-request.schema.json";
import entitlementResponseSchema from "./schemas/entitlement-response.schema.json";
import subscriptionEventSchema from "./schemas/subscription-event.schema.json";

// Import types
import { AgentAction } from "./types/action";
import { ApprovalRequest, ApprovalResponse } from "./types/approval";
import { HookInput, HookOutput } from "./types/hook";
import { PushPayload } from "./types/push";
import { DeviceRegistration } from "./types/registration";
import { Session } from "./types/session";
import {
  SubscriptionStatus,
  EntitlementRequest,
  EntitlementResponse,
  SubscriptionEvent,
} from "./types/subscription";

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
    subscriptionStatusSchema,
    entitlementRequestSchema,
    entitlementResponseSchema,
    subscriptionEventSchema,
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
const approvalRequestValidator = ajv.compile(
  getDef(approvalSchema, "ApprovalRequest"),
) as ValidateFunction<ApprovalRequest>;
const approvalResponseValidator = ajv.compile(
  getDef(approvalSchema, "ApprovalResponse"),
) as ValidateFunction<ApprovalResponse>;
const pushPayloadValidator = ajv.compile(
  getDef(pushSchema, "PushPayload"),
) as ValidateFunction<PushPayload>;
const registrationValidator = ajv.compile(
  registrationSchema,
) as ValidateFunction<DeviceRegistration>;
const hookInputValidator = ajv.compile(
  getDef(hookSchema, "HookInput"),
) as ValidateFunction<HookInput>;
const hookOutputValidator = ajv.compile(
  getDef(hookSchema, "HookOutput"),
) as ValidateFunction<HookOutput>;
const subscriptionStatusValidator = ajv.compile(
  subscriptionStatusSchema,
) as ValidateFunction<SubscriptionStatus>;
const entitlementRequestValidator = ajv.compile(
  entitlementRequestSchema,
) as ValidateFunction<EntitlementRequest>;
const entitlementResponseValidator = ajv.compile(
  entitlementResponseSchema,
) as ValidateFunction<EntitlementResponse>;
const subscriptionEventValidator = ajv.compile(
  subscriptionEventSchema,
) as ValidateFunction<SubscriptionEvent>;

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
export const validateAgentAction = createValidator(agentActionValidator);
export const validateApprovalRequest = createValidator(
  approvalRequestValidator,
);
export const validateApprovalResponse = createValidator(
  approvalResponseValidator,
);
export const validatePushPayload = createValidator(pushPayloadValidator);
export const validateDeviceRegistration = createValidator(
  registrationValidator,
);
export const validateHookInput = createValidator(hookInputValidator);
export const validateHookOutput = createValidator(hookOutputValidator);
export const validateSubscriptionStatus = createValidator(
  subscriptionStatusValidator,
);
export const validateEntitlementRequest = createValidator(
  entitlementRequestValidator,
);
export const validateEntitlementResponse = createValidator(
  entitlementResponseValidator,
);
export const validateSubscriptionEvent = createValidator(
  subscriptionEventValidator,
);

// Grouped export for ergonomic usage.
export const validate = {
  session: validateSession,
  agentAction: validateAgentAction,
  approvalRequest: validateApprovalRequest,
  approvalResponse: validateApprovalResponse,
  pushPayload: validatePushPayload,
  deviceRegistration: validateDeviceRegistration,
  hookInput: validateHookInput,
  hookOutput: validateHookOutput,
  subscriptionStatus: validateSubscriptionStatus,
  entitlementRequest: validateEntitlementRequest,
  entitlementResponse: validateEntitlementResponse,
  subscriptionEvent: validateSubscriptionEvent,
};
