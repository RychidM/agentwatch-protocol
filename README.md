# @agentwatch/protocol

The single authoritative definition of every message type in the AgentWatch protocol. TypeScript components import types and validators at compile time and runtime. Mobile apps use this repository as their reference for implementing equivalent Swift and Kotlin types.

## Installation

```bash
npm install @agentwatch/protocol
```

## Usage

### Importing Types

```typescript
import { 
  Session, 
  AgentAction, 
  ApprovalRequest,
  ApprovalResponse,
  SubscriptionStatus,
  validate 
} from '@agentwatch/protocol';

// Use types for type safety
const session: Session = {
  id: 'sess_123',
  ide: 'vscode',
  cwd: '/home/user/project',
  startedAt: '2026-03-21T10:00:00Z',
  status: 'active',
};
```

### Validating Data

```typescript
import { validate } from '@agentwatch/protocol';

// Validate incoming data
const result = validate.session(unknownData);

if (result.success) {
  // Data is valid and typed
  console.log(`Session ${result.data.id} started at ${result.data.startedAt}`);
} else {
  // Validation failed with detailed errors
  result.errors.forEach(err => {
    console.error(`${err.field}: ${err.message}`);
  });
}
```

## Core Type Definitions

### Session

A single agent conversation — tracks ID, IDE, working directory, timestamps, and status.

**Fields:**
- `id` (string, required): Unique session identifier
- `ide` (string, required): IDE name (e.g., "vscode", "cursor", "windsurf")
- `cwd` (string, required): Current working directory at session start
- `startedAt` (string, required): ISO 8601 timestamp when session started
- `endedAt` (string, optional): ISO 8601 timestamp when session ended
- `status` (string, required): Current status — `"active" | "completed" | "failed" | "cancelled"`
- `pairingId` (string, optional): Pairing ID if session is paired to a device

**Used by:** All components

### AgentAction

A single agent tool call — tracks action details, tier, and outcome.

**Fields:**
- `id` (string, required): Unique action identifier
- `sessionId` (string, required): Session this action belongs to
- `toolName` (string, required): Tool name (e.g., "read_file", "run_in_terminal")
- `input` (object, required): Tool input parameters as JSON object
- `summary` (string, required): Human-readable summary of the action
- `tier` (string, required): Action tier — `"read" | "write" | "run"`
- `timestamp` (string, required): ISO 8601 timestamp when action was requested
- `outcome` (string, optional): Action outcome — `"allowed" | "denied" | "auto_approved"`
- `autoApprovalRecord` (object, optional): Auto-approval details if outcome is `auto_approved`
  - `reason` (string, required): Reason for auto-approval — `"limit_reached"`
  - `limitType` (string, required): Type of limit reached — `"daily" | "monthly"`
  - `resetDate` (string, required): ISO 8601 timestamp when limit resets

**Used by:** Daemon, hook, relay

### ApprovalRequest

Pending decision requiring user approval.

**Fields:**
- `approvalId` (string, required): Unique approval request identifier
- `sessionId` (string, required): Session this approval belongs to
- `action` (AgentAction, required): The action requiring approval
- `precedingActions` (AgentAction[], required): Previous actions in this session for context
- `timeout` (string, required): ISO 8601 timestamp when request expires

**Used by:** Daemon, relay, phone apps

### ApprovalResponse

User decision on an approval request.

**Fields:**
- `approvalId` (string, required): Approval request ID this response is for
- `sessionId` (string, required): Session ID
- `decision` (string, required): User's decision — `"allow" | "deny"`
- `signature` (string, required): HMAC signature for authenticity verification
- `timestamp` (string, required): ISO 8601 timestamp when decision was made

**Used by:** Phone apps, daemon

### PushPayload

Relay envelope for encrypted messages sent via FCM/APNs.

**Fields:**
- `type` (string, required): Payload type — `"approval_request" | "session_start" | "session_end" | "subscription_event"`
- `sessionId` (string, optional): Session ID (if applicable)
- `pairingId` (string, required): Pairing ID for routing
- `encryptedBlob` (string, required): Encrypted message blob (base64 encoded)

**Used by:** Daemon, relay

### DeviceRegistration

Phone app registration data for push notifications.

**Fields:**
- `deviceToken` (string, required): FCM or APNs device token
- `platform` (string, required): Platform type — `"ios" | "android"`
- `sessionId` (string, optional): Current session ID (if registering during session)
- `pairingId` (string, required): Pairing ID for device linkage

**Used by:** Phone apps, relay

### HookInput

IDE stdin payload sent to the hook script.

**Fields:**
- `eventName` (string, required): Event being reported — `"tool_call" | "session_start" | "session_end"`
- `sessionId` (string, required): Session ID
- `cwd` (string, required): Current working directory
- `toolName` (string, optional): Tool name (for tool_call events)
- `toolInput` (object, optional): Tool input parameters (for tool_call events)

**Used by:** Hook script

### HookOutput

Hook response sent back to the IDE.

**Fields:**
- `decision` (string, required): Decision for the hook event — `"allow" | "deny"`
- `reason` (string, optional): Optional reason for denial

**Used by:** Hook script

## Subscription Type Definitions (v2)

### SubscriptionStatus

User's current subscription and entitlement status.

**Fields:**
- `plan` (string, required): Current subscription plan — `"free" | "pro" | "enterprise"`
- `approvalCount` (number, required): Current approval count in period
- `approvalLimit` (number | null, required): Approval limit for current plan (null = unlimited)
- `resetDate` (string, required): ISO 8601 timestamp when approval count resets
- `deviceCount` (number, required): Number of paired devices
- `featureFlags` (string[], required): Enabled feature flags — `"unlimited_approvals" | "priority_support" | "custom_branding"`

**Used by:** Relay GET /status, daemon, phone apps

### EntitlementRequest

Request to check if a user is entitled to perform an action.

**Fields:**
- `pairingId` (string, required): Pairing ID making the request
- `accountId` (string, required): Account ID for the user
- `actionType` (string, required): Action type being checked

**Used by:** Relay to accounts service

### EntitlementResponse

Result of an entitlement check.

**Fields:**
- `decision` (string, required): Whether action is allowed — `"allowed" | "denied" | "soft_limit_warning"`
- `errorCode` (string, optional): Error code if denied — `"limit_exceeded" | "plan_downgraded" | "account_suspended" | "invalid_pairing"`
- `count` (number, required): Current count in period
- `limit` (number | null, required): Limit for current plan (null = unlimited)
- `resetDate` (string, required): ISO 8601 timestamp when count resets

**Used by:** Accounts service to relay

### SubscriptionEvent

FCM message for subscription limit events.

**Fields:**
- `eventType` (string, required): Event type — `"limit_reached" | "limit_warning" | "plan_upgraded" | "plan_downgraded"`
- `limitType` (string, optional): Limit type for limit events — `"daily" | "monthly"`
- `count` (number, optional): Current count for limit events
- `limit` (number, optional): Limit value for limit events
- `resetDate` (string, optional): ISO 8601 timestamp when count resets
- `newPlan` (string, optional): New plan for upgrade/downgrade events — `"free" | "pro" | "enterprise"`

**Used by:** Relay to phone apps

### AutoApprovalRecord

Embedded in AgentAction when outcome is `auto_approved`. Determines whether the session timeline shows the amber auto-approval indicator.

**Fields:**
- `reason` (string, required): Reason for auto-approval — `"limit_reached"`
- `limitType` (string, required): Type of limit that was reached — `"daily" | "monthly"`
- `resetDate` (string, required): ISO 8601 timestamp when the limit resets

**Used by:** Daemon, phone apps

## Mobile Implementation Reference

This section documents all protocol types in plain language for iOS (Swift) and Android (Kotlin) developers.

### Implementing Types in Swift

Use `Codable` structs with snake_case to camelCase mapping:

```swift
struct Session: Codable {
    let id: String
    let ide: String
    let cwd: String
    let startedAt: String
    let endedAt: String?
    let status: SessionStatus
    let pairingId: String?
    
    enum CodingKeys: String, CodingKey {
        case id, ide, cwd, status
        case startedAt = "startedAt"
        case endedAt = "endedAt"
        case pairingId = "pairingId"
    }
}

enum SessionStatus: String, Codable {
    case active, completed, failed, cancelled
}
```

### Implementing Types in Kotlin

Use `data class` with `@SerializedName` annotations:

```kotlin
data class Session(
    @SerializedName("id") val id: String,
    @SerializedName("ide") val ide: String,
    @SerializedName("cwd") val cwd: String,
    @SerializedName("startedAt") val startedAt: String,
    @SerializedName("endedAt") val endedAt: String?,
    @SerializedName("status") val status: SessionStatus,
    @SerializedName("pairingId") val pairingId: String?
)

enum class SessionStatus {
    @SerializedName("active") ACTIVE,
    @SerializedName("completed") COMPLETED,
    @SerializedName("failed") FAILED,
    @SerializedName("cancelled") CANCELLED
}
```

### Important Implementation Notes

1. **All timestamps are ISO 8601 strings** — Parse them using appropriate date formatters:
   - Swift: `ISO8601DateFormatter()`
   - Kotlin: `SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)`

2. **Enum values are exact strings** — Never use free-form strings. All plan names, error codes, event types, and resolution types are enums.

3. **AutoApprovalRecord is critical** — When an `AgentAction` has `outcome = "auto_approved"` and includes an `autoApprovalRecord`, the mobile UI must show the amber auto-approval indicator on the timeline.

4. **Nested objects** — `ApprovalRequest` contains an `action` field (type `AgentAction`) and `precedingActions` array (`AgentAction[]`). Implement these as nested types.

5. **Optional vs Required** — Fields marked optional in the TypeScript types should be nullable in Swift/Kotlin. All other fields are required.

## Validation

All types have strict JSON schema validators with:
- `additionalProperties: false` — Rejects unexpected fields
- Explicit `maxLength` on all string fields
- Required fields explicitly listed
- Enum constraints on all categorical values

## Versioning

This package follows semantic versioning:

| Version Bump | Meaning | Coordination Required |
|--------------|---------|----------------------|
| **Major** | Breaking change — field removed, type changed, required field added | Coordinated release: protocol + desktop + relay + mobile apps |
| **Minor** | New optional fields added — backwards compatible | Desktop and relay update independently. Mobile adds new types. |
| **Patch** | Documentation or validator fixes only — no API change | Any component updates independently |

## Contributing

See [CHANGELOG.md](./CHANGELOG.md) for version history. Every release includes date, change description, affected components, and migration guides for major versions.

## License

MIT

