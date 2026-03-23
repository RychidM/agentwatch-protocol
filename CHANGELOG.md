# Changelog

All notable changes to the @agent-watch/protocol package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2026-03-23

### Fixed

- `validateSessionStatus` was missing from the named exports in `index.ts` — it was only accessible via the `validate` grouped object. Now exported as a standalone function alongside all other validators.

### Added

- Expanded test suite from 11 to 19 tests. New tests cover:
  - `validateSessionStatus` (accept and reject paths)
  - Rejection paths for all validators previously tested positively only: `validateResolvedBy`, `validateApprovalResponse`, `validatePushPayload`, `validateActionResponse`, `validateHookInput`, `validateHookOutput`

### Components Affected

- protocol package only

---

## [0.1.2] - 2026-03-23

### Changed

- Aligned protocol package to v1 implementation plan.
- Updated v1 type contracts:
  - `SessionStatus` now uses `active | idle | ended`.
  - `AgentAction` now uses `observe | approval` tier and includes `hasNonAsciiWarning`.
  - `ApprovalRequest` now uses `precedingActions` context shape with `timeoutMs` and `timestamp`.
  - `ApprovalResponse` now includes `requestTimestamp` for stale detection.
  - `PushPayload` now includes v1 payload enum (`session_start`, `activity_update`, `approval_request`, `approval_sync`, `session_end`).
  - Added `ActionResponse` type (`pushed | disconnected`).
  - Added `ResolvedBy` enum.
  - `DeviceRegistration.sessionId` is required.
  - Hook events now match v1 names (`SessionStart`, `PreToolUse`, `PostToolUse`, `SessionEnd`, `userPromptSubmitted`, `before_tool`).

### Added

- Consolidated v1 schemas:
  - `approval.schema.json` (request + response definitions)
  - `hook.schema.json` (input + output definitions)
- Named validator exports for each v1 type:
  - `validateSession`, `validateAgentAction`, `validateResolvedBy`, `validateApprovalRequest`, `validateApprovalResponse`, `validatePushPayload`, `validateActionResponse`, `validateDeviceRegistration`, `validateHookInput`, `validateHookOutput`.
- Behavioral test suite in `test/validators.test.cjs`.


### Components Affected

- protocol package only

## [0.1.0] - 2026-03-21

### Added

- Initial release of @agentwatch/protocol package
- Core type definitions:
  - `Session` — Agent conversation tracking
  - `AgentAction` — Tool call representation with tier and outcome
  - `ApprovalRequest` — Pending decisions requiring user approval
  - `ApprovalResponse` — User decisions with HMAC signatures
  - `PushPayload` — Relay envelope for encrypted messages
  - `DeviceRegistration` — Phone app registration data
  - `HookInput` / `HookOutput` — IDE stdin/stdout payloads
- Subscription type definitions (v2):
  - `SubscriptionStatus` — Plan and entitlement status
  - `EntitlementRequest` / `EntitlementResponse` — Entitlement checking
  - `SubscriptionEvent` — FCM messages for limit events
  - `AutoApprovalRecord` — Auto-approval tracking for timeline UI
- Strict JSON schema validators for all types
  - `additionalProperties: false` rejects unexpected fields
  - Explicit `maxLength` on all string fields
  - All categorical values use enums (never free-form strings)
- Validation functions with typed error reporting
- Mobile implementation reference documentation
- TypeScript type exports with full declarations

### Components Affected

- Initial release — no existing components to coordinate

### Notes

This is the foundational release establishing the single source of truth for all AgentWatch protocol types. All future changes will be documented here with coordination requirements.
