const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateSession,
  validateAgentAction,
  validateApprovalRequest,
  validateApprovalResponse,
  validatePushPayload,
  validateDeviceRegistration,
  validateHookInput,
  validateHookOutput,
} = require("../dist/index.js");

const {
  validateSubscriptionStatus,
  validateEntitlementRequest,
  validateEntitlementResponse,
  validateSubscriptionEvent,
} = require("../dist/v2.js");

const iso = "2026-03-23T10:00:00Z";

function baseAction() {
  return {
    id: "act_1",
    sessionId: "sess_1",
    toolName: "run_in_terminal",
    input: { command: "echo hello" },
    summary: "Echo hello to terminal",
    tier: "write",
    timestamp: iso,
  };
}

// --- Session ---

test("validateSession accepts valid session", () => {
  const result = validateSession({
    id: "sess_1",
    ide: "vscode",
    cwd: "/home/user/project",
    startedAt: iso,
    status: "active",
  });
  assert.equal(result.success, true);
});

test("validateSession accepts session with pairingId", () => {
  const result = validateSession({
    id: "sess_1",
    ide: "cursor",
    cwd: "/tmp",
    startedAt: iso,
    status: "completed",
    pairingId: "pair_1",
  });
  assert.equal(result.success, true);
});

test("validateSession rejects old v1 status values", () => {
  const result = validateSession({
    id: "sess_1",
    ide: "vscode",
    cwd: "/tmp",
    startedAt: iso,
    status: "idle",
  });
  assert.equal(result.success, false);
});

test("validateSession accepts all v2 statuses", () => {
  for (const status of ["active", "completed", "failed", "cancelled"]) {
    const result = validateSession({
      id: "sess_1",
      ide: "vscode",
      cwd: "/tmp",
      startedAt: iso,
      status,
    });
    assert.equal(result.success, true, `status "${status}" should be valid`);
  }
});

// --- AgentAction ---

test("validateAgentAction accepts valid action", () => {
  const result = validateAgentAction(baseAction());
  assert.equal(result.success, true);
});

test("validateAgentAction accepts action with outcome and autoApprovalRecord", () => {
  const action = {
    ...baseAction(),
    outcome: "auto_approved",
    autoApprovalRecord: {
      reason: "limit_reached",
      limitType: "daily",
      resetDate: iso,
    },
  };
  const result = validateAgentAction(action);
  assert.equal(result.success, true);
});

test("validateAgentAction rejects old v1 tier values", () => {
  const action = { ...baseAction(), tier: "approval" };
  const result = validateAgentAction(action);
  assert.equal(result.success, false);
});

test("validateAgentAction accepts all v2 tiers", () => {
  for (const tier of ["read", "write", "run"]) {
    const action = { ...baseAction(), tier };
    const result = validateAgentAction(action);
    assert.equal(result.success, true, `tier "${tier}" should be valid`);
  }
});

test("validateAgentAction does not require hasNonAsciiWarning (v1 field removed)", () => {
  const action = baseAction();
  const result = validateAgentAction(action);
  assert.equal(result.success, true);
});

// --- ApprovalRequest ---

test("validateApprovalRequest accepts valid request", () => {
  const result = validateApprovalRequest({
    approvalId: "apr_1",
    sessionId: "sess_1",
    action: baseAction(),
    precedingActions: [baseAction()],
    timeout: iso,
  });
  assert.equal(result.success, true);
});

test("validateApprovalRequest uses timeout string instead of v1 timeoutMs", () => {
  const result = validateApprovalRequest({
    approvalId: "apr_1",
    sessionId: "sess_1",
    action: baseAction(),
    precedingActions: [],
    timeoutMs: 120000,
  });
  assert.equal(result.success, false);
});

test("validateApprovalRequest precedingActions are full AgentAction objects", () => {
  // v1 used ApprovalContextAction (toolName+summary only) — v2 uses full AgentAction
  const result = validateApprovalRequest({
    approvalId: "apr_1",
    sessionId: "sess_1",
    action: baseAction(),
    precedingActions: [{ toolName: "read_file", summary: "Read config" }],
    timeout: iso,
  });
  assert.equal(result.success, false);
});

// --- ApprovalResponse ---

test("validateApprovalResponse accepts valid response", () => {
  const result = validateApprovalResponse({
    approvalId: "apr_1",
    sessionId: "sess_1",
    decision: "allow",
    signature: "hmac_signature_value",
    requestTimestamp: iso,
  });
  assert.equal(result.success, true);
});

test("validateApprovalResponse rejects old v1 timestamp field name", () => {
  const result = validateApprovalResponse({
    approvalId: "apr_1",
    sessionId: "sess_1",
    decision: "allow",
    signature: "hmac_value",
    timestamp: iso,
  });
  assert.equal(result.success, false);
});

// --- PushPayload ---

test("validatePushPayload accepts valid payload", () => {
  const result = validatePushPayload({
    type: "approval_request",
    pairingId: "pair_1",
    encryptedBlob: "aGVsbG8=",
  });
  assert.equal(result.success, true);
});

test("validatePushPayload rejects v2 subscription_event type", () => {
  const result = validatePushPayload({
    type: "subscription_event",
    pairingId: "pair_1",
    encryptedBlob: "aGVsbG8=",
  });
  assert.equal(result.success, false);
});

test("validatePushPayload sessionId is optional", () => {
  const result = validatePushPayload({
    type: "session_start",
    sessionId: "sess_1",
    pairingId: "pair_1",
    encryptedBlob: "aGVsbG8=",
  });
  assert.equal(result.success, true);
});

test("validatePushPayload rejects old v1 types", () => {
  const result = validatePushPayload({
    type: "activity_update",
    pairingId: "pair_1",
    encryptedBlob: "aGVsbG8=",
  });
  assert.equal(result.success, false);
});

// --- DeviceRegistration ---

test("validateDeviceRegistration accepts valid registration", () => {
  const result = validateDeviceRegistration({
    deviceToken: "device_token_123",
    platform: "ios",
    pairingId: "pair_1",
  });
  assert.equal(result.success, true);
});

test("validateDeviceRegistration sessionId is optional", () => {
  const result = validateDeviceRegistration({
    deviceToken: "device_token_123",
    platform: "android",
    sessionId: "sess_1",
    pairingId: "pair_1",
  });
  assert.equal(result.success, true);
});

// --- HookInput ---

test("validateHookInput accepts tool_call event", () => {
  const result = validateHookInput({
    eventName: "tool_call",
    sessionId: "sess_1",
    cwd: "/tmp",
    toolName: "read_file",
    toolInput: { path: "/etc/hosts" },
  });
  assert.equal(result.success, true);
});

test("validateHookInput accepts session_start event", () => {
  const result = validateHookInput({
    eventName: "session_start",
    sessionId: "sess_1",
    cwd: "/tmp",
  });
  assert.equal(result.success, true);
});

test("validateHookInput rejects old v1 event names", () => {
  const result = validateHookInput({
    eventName: "SessionStart",
    sessionId: "sess_1",
    cwd: "/tmp",
  });
  assert.equal(result.success, false);
});

test("validateHookInput rejects source field (v1 removed)", () => {
  const result = validateHookInput({
    eventName: "session_start",
    sessionId: "sess_1",
    cwd: "/tmp",
    source: "startup",
  });
  assert.equal(result.success, false);
});

// --- HookOutput ---

test("validateHookOutput accepts deny with reason", () => {
  const result = validateHookOutput({
    decision: "deny",
    reason: "User denied this action",
  });
  assert.equal(result.success, true);
});

test("validateHookOutput rejects unknown decision", () => {
  assert.equal(validateHookOutput({ decision: "skip" }).success, false);
});

// --- SubscriptionStatus ---

test("validateSubscriptionStatus accepts valid status", () => {
  const result = validateSubscriptionStatus({
    plan: "pro",
    approvalCount: 42,
    approvalLimit: 100,
    resetDate: iso,
    deviceCount: 2,
    featureFlags: ["unlimited_approvals"],
  });
  assert.equal(result.success, true);
});

test("validateSubscriptionStatus accepts null approvalLimit (unlimited)", () => {
  const result = validateSubscriptionStatus({
    plan: "enterprise",
    approvalCount: 0,
    approvalLimit: null,
    resetDate: iso,
    deviceCount: 5,
    featureFlags: ["unlimited_approvals", "priority_support", "custom_branding"],
  });
  assert.equal(result.success, true);
});

test("validateSubscriptionStatus rejects invalid plan", () => {
  const result = validateSubscriptionStatus({
    plan: "premium",
    approvalCount: 0,
    approvalLimit: 10,
    resetDate: iso,
    deviceCount: 1,
    featureFlags: [],
  });
  assert.equal(result.success, false);
});

test("validateSubscriptionStatus rejects invalid featureFlag", () => {
  const result = validateSubscriptionStatus({
    plan: "free",
    approvalCount: 0,
    approvalLimit: 10,
    resetDate: iso,
    deviceCount: 1,
    featureFlags: ["invalid_flag"],
  });
  assert.equal(result.success, false);
});

// --- EntitlementRequest ---

test("validateEntitlementRequest accepts valid request", () => {
  const result = validateEntitlementRequest({
    pairingId: "pair_1",
    accountId: "acct_123",
    actionType: "approval",
  });
  assert.equal(result.success, true);
});

test("validateEntitlementRequest rejects missing accountId", () => {
  const result = validateEntitlementRequest({
    pairingId: "pair_1",
    actionType: "approval",
  });
  assert.equal(result.success, false);
});

// --- EntitlementResponse ---

test("validateEntitlementResponse accepts allowed response", () => {
  const result = validateEntitlementResponse({
    decision: "allowed",
    count: 5,
    limit: 100,
    resetDate: iso,
  });
  assert.equal(result.success, true);
});

test("validateEntitlementResponse accepts denied with errorCode", () => {
  const result = validateEntitlementResponse({
    decision: "denied",
    errorCode: "limit_exceeded",
    count: 100,
    limit: 100,
    resetDate: iso,
  });
  assert.equal(result.success, true);
});

test("validateEntitlementResponse accepts null limit (unlimited)", () => {
  const result = validateEntitlementResponse({
    decision: "allowed",
    count: 0,
    limit: null,
    resetDate: iso,
  });
  assert.equal(result.success, true);
});

test("validateEntitlementResponse rejects invalid decision", () => {
  const result = validateEntitlementResponse({
    decision: "maybe",
    count: 0,
    limit: 10,
    resetDate: iso,
  });
  assert.equal(result.success, false);
});

// --- SubscriptionEvent ---

test("validateSubscriptionEvent accepts limit_reached event", () => {
  const result = validateSubscriptionEvent({
    eventType: "limit_reached",
    limitType: "daily",
    count: 50,
    limit: 50,
    resetDate: iso,
  });
  assert.equal(result.success, true);
});

test("validateSubscriptionEvent accepts plan_upgraded event", () => {
  const result = validateSubscriptionEvent({
    eventType: "plan_upgraded",
    newPlan: "pro",
  });
  assert.equal(result.success, true);
});

test("validateSubscriptionEvent rejects invalid eventType", () => {
  const result = validateSubscriptionEvent({
    eventType: "subscription_cancelled",
  });
  assert.equal(result.success, false);
});

test("validateSubscriptionEvent only requires eventType", () => {
  const result = validateSubscriptionEvent({
    eventType: "limit_warning",
  });
  assert.equal(result.success, true);
});
