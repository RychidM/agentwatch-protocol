# @agent-watch/protocol

Shared TypeScript type definitions and JSON schema validators for all AgentWatch components. This is the single source of truth for every message exchanged between the daemon, relay, and mobile apps.

---

## What is this

AgentWatch has multiple components written in different languages that communicate by passing structured JSON. Without a shared contract, schema drift occurs — a field added in one component is missed in others, validators diverge, and protocol changes have no clear record.

This package defines every message type in the system. TypeScript components import types and validators directly. iOS and Android developers use this repository as the specification for implementing equivalent Swift Codable structs and Kotlin data classes.

---

## Installation

```bash
npm install @agent-watch/protocol
# or
yarn add @agent-watch/protocol
```
---

## Contents

### Core types

| Type | Description |
|------|-------------|
| `Session` | A single agent conversation |
| `AgentAction` | A single agent tool call |
| `ApprovalRequest` | An action requiring the user's decision |
| `ApprovalResponse` | The user's decision, HMAC-signed by the phone |
| `PushPayload` | Encrypted envelope sent from daemon to relay |
| `DeviceRegistration` | Phone registration sent to the relay |
| `HookInput` | JSON the hook script validates from IDE stdin |
| `HookOutput` | The hook script's response to the IDE |

### Validators

Every type ships with a runtime JSON schema validator. Use them to validate untrusted input at component boundaries.

```ts
import {
  validateApprovalRequest,
  validateActionResponse,
} from "@agent-watch/protocol";

const reqResult = validateApprovalRequest(input);
if (!reqResult.success) {
  console.error(reqResult.errors);
}

const actionResult = validateActionResponse({ status: "disconnected" });
if (actionResult.success) {
  console.log(actionResult.data.status);
}
```

Also available as grouped validators:

```ts
import { validate } from "@agent-watch/protocol";

const result = validate.hookInput(parsed);
```

## Versioning

| Bump | Meaning | Action required |
|------|---------|----------------|
| Major | Breaking change — field removed or type changed | Coordinated release across all components |
| Minor | New optional types added | Components update independently |
| Patch | Documentation or validator fixes only | Any component updates independently |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Protocol changes must include updated type definitions, updated schema validators, updated mobile reference documentation, and a CHANGELOG entry.

---

## Related repositories

- [agentwatch-desktop](https://github.com/agentwatch/agentwatch-desktop) — daemon, hook script, installer
- [agentwatch-relay](https://github.com/agentwatch/agentwatch-relay) — self-hosted relay server
- [agentwatch-ios](https://github.com/agentwatch/agentwatch-ios) — iOS app
- [agentwatch-android](https://github.com/agentwatch/agentwatch-android) — Android app

---

## License

GNU Affero General Public License v3.0

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).
