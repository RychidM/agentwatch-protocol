# AgentWatch — Protocol Package Implementation Plan

Complete guide to building the @agentwatch/protocol package.

**Language:** TypeScript  |  **Published to:** npm  |  **Repo:** agentwatch-protocol

---

## Rollout phases

### Version 1 — open source (ships first)

The v1 protocol package contains only the core message types needed for the approval flow, session management, and push delivery. No subscription types. No account types.

### Version 2 — cloud service (added later)

V2 adds subscription-related types: SubscriptionStatus, EntitlementRequest, EntitlementResponse, SubscriptionEvent, and IdeLimitFallbackRecord.

All documentation reflects v1 unless explicitly marked v2.

---

## Why this package exists

Every AgentWatch component communicates by passing structured JSON. Without a shared source of truth, schema drift occurs — fields added in one component are missed in others, validators diverge, and protocol changes have no clear record. The @agentwatch/protocol package is the single authoritative definition of every message type.

TypeScript components (desktop and relay) import types and validators from it at compile time and runtime. Mobile apps use the repository as a reference for implementing equivalent Swift and Kotlin types.

---

## Repository structure

```
agentwatch-protocol/
├── package.json
├── tsconfig.json
├── README.md
├── CHANGELOG.md
└── src/
    ├── index.ts
    ├── types/
    │   ├── session.ts
    │   ├── action.ts
    │   ├── approval.ts
    │   ├── push.ts
    │   ├── registration.ts
    │   └── hook.ts
    └── schemas/
        ├── session.schema.json
        ├── action.schema.json
        ├── approval.schema.json
        ├── push.schema.json
        ├── registration.schema.json
        └── hook.schema.json
```

---

## V1 type definitions

### Session

A single agent conversation. Fields: session ID, IDE name, working directory, start timestamp, end timestamp (optional), status (active, idle, or ended).

### AgentAction

A single agent tool call. Fields: action ID, session ID, tool name, tool input (record of string keys to unknown values — the full arguments), tool summary (human-readable one-liner), tier (observe or approval), non-ASCII warning flag set by the daemon's sanitisation pipeline, and timestamp.

### ApprovalRequest

An action requiring the user's decision. Fields: approval ID (single-use UUID from CSPRNG), session ID, the AgentAction being approved, last three preceding actions as context (tool name and summary only — not full input), timeout in milliseconds, and timestamp. Created by the daemon, forwarded to the phone via the relay.

### ApprovalResponse

The user's decision. Fields: approval ID, session ID, decision (allow or deny), HMAC signature computed by the phone using the shared pairing key, and the original request timestamp for stale detection. This type is only created when the user responds on the phone. When the IDE handles an approval, no ApprovalResponse is created — the outcome is captured via the PostToolUse hook.

The `session_allowlist` and `always_allow` optional fields are not present in v1 — they are added in v2 alongside the allowlist feature.

### PushPayload

The envelope sent from the daemon to the relay. Fields: payload type (one of the push types listed below), session ID for routing, pairing ID for routing, and encrypted blob (the actual content, opaque to the relay). The relay routes by session ID and pairing ID only — it never reads the blob.

Push payload types in v1: session_start, activity_update, approval_request, approval_sync, session_end.

### ActionResponse

Returned by the relay to the daemon on `POST /action`. Indicates the outcome of the push delivery attempt so the daemon knows how to proceed. Fields: status (one of `pushed`, `disconnected`). When status is `pushed`, the daemon parks the approval in the queue waiting for a phone callback. When status is `disconnected`, the daemon exits the hook with code 0 and no stdout — the IDE handles the approval. No additional fields are returned in either case — the relay never exposes internal state about session routing.

### ResolvedBy

A string enum used in SessionAction records to identify who resolved an approval. Values in v1: `phone` (user tapped on the phone app), `ide` (user clicked the IDE dialog while phone was also available — dual approval), `ide_limit_fallback` (monthly approval limit reached — phone path unavailable), `ide_disconnected` (phone was disconnected by the user — phone path intentionally paused), `timeout` (120-second auto-deny fired with no response).

The `session_allowlist` and `always_allow` values are not present in v1 — they are added in v2 alongside the allowlist feature.

### DeviceRegistration

Sent by the phone to the relay's register endpoint after pairing. Fields: device token (APNs or FCM), platform (ios or android), session ID to subscribe to, and pairing ID.

### HookInput

The JSON schema the hook script validates its stdin against. Fields: hook event name (one of SessionStart, PreToolUse, PostToolUse, SessionEnd, userPromptSubmitted, before_tool), session ID, working directory, tool name (optional, present for tool events), tool input (optional), and source (for session start events — startup, resume, or clear).

### HookOutput

The response the hook script writes to stdout. Fields: decision (allow or deny) and optional reason string shown to the agent when denied.

---

## JSON schema validators

Strict schemas for all v1 types. additionalProperties: false rejects unexpected fields. All string fields have explicit maxLength values. Required fields listed explicitly. All enums — decision values, tier values, event names, platform values, status values — are defined as string literal unions in TypeScript and enum arrays in JSON schema. No free-form strings for values with a fixed set of options.

The package exports a validate function for each type that takes an unknown value and returns a typed result or a validation error with field-level detail.

---

## Mobile reference documentation

The README includes a Mobile Implementation Reference section documenting every v1 type in plain language — field names, their TypeScript types, whether required or optional, and example values. iOS developers implement Swift Codable structs matching these definitions. Android developers implement Kotlin data classes. When the protocol changes, mobile developers consult the CHANGELOG to know what to update.

The ApprovalRequest type is documented with particular care because the preceding actions context array contains only tool name and summary — not full tool input. This is intentional: the relay and push payload never carry full tool input, only the device stores it.

---

## Versioning

Major version bump: breaking change — field removed, type changed, required field added. Requires coordinated release of desktop, relay, and mobile apps.

Minor version bump: new optional fields added. Desktop and relay update independently.

Patch version bump: documentation or validator fixes only.

The CHANGELOG documents every version with date, description, affected components, and migration guide for major versions. The package is published to npm under the @agentwatch scope. CI automates publishing on version tag push.

---

## V2 additions (cloud service — not in v1)

The following types are added in v2:

- SubscriptionStatus — returned by relay GET /status, includes mode field ('cloud' or 'self-hosted')
- EntitlementRequest — sent from relay to internal accounts service
- EntitlementResponse — returned by accounts service to relay
- SubscriptionEvent — FCM message type for cloud limit events
- IdeLimitFallbackRecord — embedded in SessionAction outcomes when IDE handled approval due to monthly limit
- ApprovalResponse gains two optional boolean fields: `session_allowlist` (Pro plan — "Allow in this session") and `always_allow` (Pro plan — "Always allow"). Both are absent in v1 ApprovalResponse
- ResolvedBy gains two additional enum values: `session_allowlist` and `always_allow`. Both are absent in v1
- AllowlistEntry — persisted allowlist rule for "Always allow". Fields: tool name, optional argument pattern, created_at, session ID it was created in, and account ID (v2 cloud) or null (v2 self-hosted with local SQLite)

These are added as a minor version bump (new optional fields and types, nothing existing changed) and do not affect v1 deployments.

---

*AgentWatch Protocol Package Implementation Plan — v1 open source first, v2 subscription types added*