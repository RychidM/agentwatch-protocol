AgentWatch — Protocol Package Implementation Plan

Estimated duration: 1 week  |  Language: TypeScript  |  Published to: npm  |  Repo: agentwatch-protocol

 

Why this package exists
Every AgentWatch component communicates by passing structured JSON. Without a shared source of truth, schema drift occurs — a field added in one component is missed in others, validators diverge, and protocol changes have no clear record. The @agentwatch/protocol package is the single authoritative definition of every message type. TypeScript components import types and validators at compile time and runtime. Mobile apps use the repository as their reference for implementing equivalent Swift and Kotlin types.

 
Repository structure
agentwatch-protocol/ contains: package.json, tsconfig.json, README.md, CHANGELOG.md, and src/ with index.ts, types/ (session.ts, action.ts, approval.ts, push.ts, registration.ts, subscription.ts), and schemas/ (one .schema.json per type).

 
Core type definitions
Type
Description
Used by
Session
A single agent conversation — ID, IDE, cwd, timestamps, status
All components
AgentAction
A single agent tool call — ID, session ID, tool name, input, summary, tier, timestamp
Daemon, hook, relay
ApprovalRequest
Pending decision — approval ID, session ID, action, preceding actions, timeout
Daemon, relay, phone apps
ApprovalResponse
User decision — approval ID, session ID, decision, HMAC signature, timestamp
Phone apps, daemon
PushPayload
Relay envelope — payload type, session ID, pairing ID, encrypted blob
Daemon, relay
DeviceRegistration
Phone registration — device token, platform, session ID, pairing ID
Phone apps, relay
HookInput
IDE stdin payload — event name, session ID, cwd, tool name, tool input
Hook script
HookOutput
Hook response to IDE — decision (allow/deny) and optional reason
Hook script
 
Subscription type definitions (new in v2)
Type
Description
Used by
SubscriptionStatus
Plan, approval count, limit, reset date, device count, feature flags
Relay GET /status, daemon, phone apps
EntitlementRequest
Pairing ID, account ID, action type being checked
Relay to accounts service
EntitlementResponse
allowed / denied / soft_limit_warning with error code, count, limit, reset date
Accounts service to relay
SubscriptionEvent
FCM message for limit events — event type, limit type, count, limit, reset date
Relay to phone apps
AutoApprovalRecord
Embedded in SessionAction outcome — reason (limit_reached), limit type, reset date
Daemon, phone apps
 
JSON schema validators
Strict schemas for all types. additionalProperties: false rejects unexpected fields. All string fields have explicit maxLength. Required fields listed explicitly. All plan names, error codes, event types, and resolution types are enums — never free-form strings. The package exports a validate function for each type that takes an unknown value and returns a typed result or a validation error with field-level detail.

 
Mobile reference documentation
The README includes a Mobile Implementation Reference section documenting every type including subscription types in plain language — field names, types, whether required or optional, and example values. iOS and Android developers consult this section when implementing Swift Codable structs and Kotlin data classes. The AutoApprovalRecord type is documented with particular care because it determines whether the session timeline shows the amber auto-approval indicator.

 
Versioning and coordination
Version bump
Meaning
Coordination required
Major
Breaking change — field removed, type changed, required field added
Coordinated release: protocol + desktop + relay + mobile apps
Minor
New optional fields added — backwards compatible
Desktop and relay update independently. Mobile adds new types.
Patch
Documentation or validator fixes only — no API change
Any component updates independently
The CHANGELOG.md documents every version with date, change description, affected components, and for major versions a migration guide. The package is published to npm under the @agentwatch scope. Every release is tagged in git. npm publish is automated via CI on version tag push.