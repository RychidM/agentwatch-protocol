# Changelog

All notable changes to the @agentwatch/protocol package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
