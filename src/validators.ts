/**
 * Validation utilities using JSON schemas
 */

import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

// Import all schemas
import sessionSchema from './schemas/session.schema.json';
import actionSchema from './schemas/action.schema.json';
import approvalRequestSchema from './schemas/approval-request.schema.json';
import approvalResponseSchema from './schemas/approval-response.schema.json';
import pushSchema from './schemas/push.schema.json';
import registrationSchema from './schemas/registration.schema.json';
import hookInputSchema from './schemas/hook-input.schema.json';
import hookOutputSchema from './schemas/hook-output.schema.json';
import subscriptionStatusSchema from './schemas/subscription-status.schema.json';
import entitlementRequestSchema from './schemas/entitlement-request.schema.json';
import entitlementResponseSchema from './schemas/entitlement-response.schema.json';
import subscriptionEventSchema from './schemas/subscription-event.schema.json';

// Import types
import { Session } from './types/session';
import { AgentAction } from './types/action';
import { ApprovalRequest, ApprovalResponse } from './types/approval';
import { PushPayload } from './types/push';
import { DeviceRegistration } from './types/registration';
import { HookInput, HookOutput } from './types/hook';
import {
  SubscriptionStatus,
  EntitlementRequest,
  EntitlementResponse,
  SubscriptionEvent,
} from './types/subscription';

// Initialize Ajv with strict mode
const ajv = new Ajv({ 
  strict: true,
  allErrors: true,
  schemas: [
    sessionSchema,
    actionSchema,
    approvalRequestSchema,
    approvalResponseSchema,
    pushSchema,
    registrationSchema,
    hookInputSchema,
    hookOutputSchema,
    subscriptionStatusSchema,
    entitlementRequestSchema,
    entitlementResponseSchema,
    subscriptionEventSchema,
  ]
});

// Add format validators
addFormats(ajv);

// Create typed validators
const validateSession = ajv.compile(sessionSchema) as ValidateFunction<Session>;
const validateAgentAction = ajv.compile(actionSchema) as ValidateFunction<AgentAction>;
const validateApprovalRequest = ajv.compile(approvalRequestSchema) as ValidateFunction<ApprovalRequest>;
const validateApprovalResponse = ajv.compile(approvalResponseSchema) as ValidateFunction<ApprovalResponse>;
const validatePushPayload = ajv.compile(pushSchema) as ValidateFunction<PushPayload>;
const validateDeviceRegistration = ajv.compile(registrationSchema) as ValidateFunction<DeviceRegistration>;
const validateHookInput = ajv.compile(hookInputSchema) as ValidateFunction<HookInput>;
const validateHookOutput = ajv.compile(hookOutputSchema) as ValidateFunction<HookOutput>;
const validateSubscriptionStatus = ajv.compile(subscriptionStatusSchema) as ValidateFunction<SubscriptionStatus>;
const validateEntitlementRequest = ajv.compile(entitlementRequestSchema) as ValidateFunction<EntitlementRequest>;
const validateEntitlementResponse = ajv.compile(entitlementResponseSchema) as ValidateFunction<EntitlementResponse>;
const validateSubscriptionEvent = ajv.compile(subscriptionEventSchema) as ValidateFunction<SubscriptionEvent>;

/** Validation result with typed data or error details */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Array<{ field: string; message: string }> };

/** Format Ajv errors for better readability */
function formatErrors(validator: ValidateFunction): Array<{ field: string; message: string }> {
  if (!validator.errors) return [{ field: 'unknown', message: 'Validation failed' }];
  
  return validator.errors.map(err => ({
    field: err.instancePath || err.schemaPath,
    message: err.message || 'Validation error',
  }));
}

/** Generic validate function wrapper */
function createValidator<T>(validator: ValidateFunction<T>) {
  return (data: unknown): ValidationResult<T> => {
    if (validator(data)) {
      return { success: true, data };
    }
    return { success: false, errors: formatErrors(validator) };
  };
}

// Export validation functions
export const validate = {
  session: createValidator(validateSession),
  agentAction: createValidator(validateAgentAction),
  approvalRequest: createValidator(validateApprovalRequest),
  approvalResponse: createValidator(validateApprovalResponse),
  pushPayload: createValidator(validatePushPayload),
  deviceRegistration: createValidator(validateDeviceRegistration),
  hookInput: createValidator(validateHookInput),
  hookOutput: createValidator(validateHookOutput),
  subscriptionStatus: createValidator(validateSubscriptionStatus),
  entitlementRequest: createValidator(validateEntitlementRequest),
  entitlementResponse: createValidator(validateEntitlementResponse),
  subscriptionEvent: createValidator(validateSubscriptionEvent),
};
