const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateSession,
  validateSessionStatus,
  validateAgentAction,
  validateResolvedBy,
  validateApprovalRequest,
  validateApprovalResponse,
  validatePushPayload,
  validateActionResponse,
  validateDeviceRegistration,
  validateHookInput,
  validateHookOutput,
} = require("../dist/index.js");

const iso = "2026-03-23T10:00:00Z";

function baseAction() {
  return {
    id: "act_1",
    sessionId: "sess_1",
    toolName: "run_in_terminal",
    input: { command: "echo hello" },
    summary: "Echo hello to terminal",
    tier: "approval",
    hasNonAsciiWarning: false,
    timestamp: iso,
  };
}

test("validateSession accepts valid session", () => {
  const result = validateSession({
    id: "sess_1",
    ide: "vscode",
    cwd: "/home/allfather/dev/backend/agentwatch/agentwatch-protocol",
    startedAt: iso,
    status: "active",
  });

  assert.equal(result.success, true);
});

test("validateSession rejects invalid status", () => {
  const result = validateSession({
    id: "sess_1",
    ide: "vscode",
    cwd: "/tmp",
    startedAt: iso,
    status: "completed",
  });

  assert.equal(result.success, false);
});

test("validateAgentAction requires hasNonAsciiWarning", () => {
  const action = baseAction();
  delete action.hasNonAsciiWarning;

  const result = validateAgentAction(action);
  assert.equal(result.success, false);
});

test("validateResolvedBy accepts v1 enum values", () => {
  const result = validateResolvedBy("ide_disconnected");
  assert.equal(result.success, true);
});

test("validateApprovalRequest enforces max preceding actions = 3", () => {
  const request = {
    approvalId: "apr_1",
    sessionId: "sess_1",
    action: baseAction(),
    precedingActions: [
      { toolName: "read_file", summary: "Read config file" },
      { toolName: "list_dir", summary: "List source directory" },
      { toolName: "grep_search", summary: "Search for TODO comments" },
      { toolName: "run_in_terminal", summary: "Run unit tests" },
    ],
    timeoutMs: 120000,
    timestamp: iso,
  };

  const result = validateApprovalRequest(request);
  assert.equal(result.success, false);
});

test("validateApprovalResponse requires requestTimestamp", () => {
  const result = validateApprovalResponse({
    approvalId: "apr_1",
    sessionId: "sess_1",
    decision: "allow",
    signature: "hmac_signature_value",
    requestTimestamp: iso,
  });

  assert.equal(result.success, true);
});

test("validatePushPayload accepts activity_update type", () => {
  const result = validatePushPayload({
    type: "activity_update",
    sessionId: "sess_1",
    pairingId: "pair_1",
    encryptedBlob: "aGVsbG8=",
  });

  assert.equal(result.success, true);
});

test("validateActionResponse accepts disconnected status", () => {
  const result = validateActionResponse({ status: "disconnected" });
  assert.equal(result.success, true);
});

test("validateDeviceRegistration requires sessionId", () => {
  const result = validateDeviceRegistration({
    deviceToken: "device_token_123",
    platform: "ios",
    pairingId: "pair_1",
  });

  assert.equal(result.success, false);
});

test("validateHookInput accepts SessionStart with source", () => {
  const result = validateHookInput({
    eventName: "SessionStart",
    sessionId: "sess_1",
    cwd: "/tmp",
    source: "startup",
  });

  assert.equal(result.success, true);
});

test("validateHookOutput accepts deny with reason", () => {
  const result = validateHookOutput({
    decision: "deny",
    reason: "User denied this action",
  });

  assert.equal(result.success, true);
});

// --- SessionStatus ---

test("validateSessionStatus accepts active", () => {
  assert.equal(validateSessionStatus("active").success, true);
});

test("validateSessionStatus rejects unknown status", () => {
  assert.equal(validateSessionStatus("completed").success, false);
});

// --- Rejection paths for validators tested only positively above ---

test("validateResolvedBy rejects unknown value", () => {
  assert.equal(validateResolvedBy("always_allow").success, false);
});

test("validateApprovalResponse rejects missing requestTimestamp", () => {
  const result = validateApprovalResponse({
    approvalId: "apr_1",
    sessionId: "sess_1",
    decision: "allow",
    signature: "hmac_value",
  });
  assert.equal(result.success, false);
});

test("validatePushPayload rejects unknown type", () => {
  const result = validatePushPayload({
    type: "unknown_event",
    sessionId: "sess_1",
    pairingId: "pair_1",
    encryptedBlob: "aGVsbG8=",
  });
  assert.equal(result.success, false);
});

test("validateActionResponse rejects unknown status", () => {
  assert.equal(validateActionResponse({ status: "pending" }).success, false);
});

test("validateHookInput rejects unknown eventName", () => {
  const result = validateHookInput({
    eventName: "ToolCall",
    sessionId: "sess_1",
    cwd: "/tmp",
  });
  assert.equal(result.success, false);
});

test("validateHookOutput rejects unknown decision", () => {
  assert.equal(validateHookOutput({ decision: "skip" }).success, false);
});
