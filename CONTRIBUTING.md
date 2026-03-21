# Contributing to @agentwatch/protocol

Thank you for contributing to the AgentWatch protocol package! This package is the single source of truth for all AgentWatch message types, so changes here affect all components in the ecosystem.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Making Changes](#making-changes)
- [Testing Your Changes](#testing-your-changes)
- [Submitting Changes](#submitting-changes)
- [Versioning Guidelines](#versioning-guidelines)
- [Code Standards](#code-standards)

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/RychidM/agentwatch-protocol.git
cd agentwatch-protocol

# Install dependencies
npm install

# Build the package
npm run build

# Run type checking
npm run typecheck
```

## Development Workflow

### Project Structure

```
src/
├── types/              # TypeScript type definitions
│   ├── session.ts
│   ├── action.ts
│   ├── approval.ts
│   ├── push.ts
│   ├── registration.ts
│   ├── hook.ts
│   └── subscription.ts
├── schemas/            # JSON Schema validators
│   └── *.schema.json
├── validators.ts       # Runtime validation functions
└── index.ts           # Main export file
```

### Development Commands

```bash
# Type check without building
npm run typecheck

# Build TypeScript to dist/
npm run build

# Watch mode (requires installing dev dependencies for watch)
npm run build -- --watch
```

## Making Changes

### Adding a New Type

When adding a new protocol type, you must create **three** files:

1. **TypeScript type definition** in `src/types/[name].ts`:
   ```typescript
   export interface NewType {
     id: string;
     // ... other fields with JSDoc comments
   }
   ```

2. **JSON Schema** in `src/schemas/[name].schema.json`:
   ```json
   {
     "$schema": "http://json-schema.org/draft-07/schema#",
     "type": "object",
     "additionalProperties": false,
     "required": ["id"],
     "properties": {
       "id": {
         "type": "string",
         "maxLength": 255
       }
     }
   }
   ```

3. **Update exports** in three places:
   - Export the type in `src/index.ts`
   - Import schema in `src/validators.ts`
   - Add validator function in `src/validators.ts`

### Modifying Existing Types

**⚠️ Breaking Changes** — Coordinate with all AgentWatch components:

- Removing a field → **Major version bump**
- Changing a field type → **Major version bump**
- Adding a required field → **Major version bump**
- Renaming a field → **Major version bump**

**✅ Non-Breaking Changes** — Backwards compatible:

- Adding an optional field → **Minor version bump**
- Expanding enum values → **Minor version bump** (document carefully)
- Updating field descriptions → **Patch version bump**

### Schema Requirements

All JSON schemas must follow these rules:

1. **Strict validation**: Set `"additionalProperties": false`
2. **Explicit lengths**: All string fields must have `maxLength`
3. **Enums only**: Use enums for categorical values, never free-form strings
4. **Required fields**: List all required fields explicitly
5. **ISO 8601**: Use `"format": "date-time"` for timestamps

Example:
```json
{
  "status": {
    "type": "string",
    "enum": ["active", "completed", "failed"],
    "description": "Current status"
  }
}
```

## Testing Your Changes

### Type Checking

```bash
npm run typecheck
```

This ensures all TypeScript types are correctly defined.

### Build Test

```bash
npm run build
```

Successful build confirms:
- No TypeScript errors
- All imports resolve correctly
- JSON schemas are valid
- Type declarations generate properly

### Manual Testing

Test the package locally in another project:

```bash
# In agentwatch-protocol directory
npm pack

# In your test project
npm install /path/to/agentwatch-protocol-0.1.0.tgz
```

Then verify:
```typescript
import { Session, validate } from '@agentwatch/protocol';

const session: Session = { /* ... */ };
const result = validate.session(session);
```

## Submitting Changes

### 1. Create a Branch

```bash
git checkout -b feature/add-new-type
# or
git checkout -b fix/typo-in-docs
```

### 2. Make Your Changes

Follow the guidelines above. Ensure:
- Type definitions include JSDoc comments
- JSON schemas are strict and complete
- All enums are exhaustive

### 3. Update Documentation

- Update `CHANGELOG.md` with your changes under "Unreleased"
- If adding/changing types, update the relevant section in `README.md`
- For breaking changes, add migration notes

### 4. Build and Verify

```bash
npm run typecheck
npm run build
```

### 5. Commit

Use clear, descriptive commit messages:

```bash
# Good commit messages
git commit -m "Add HealthCheck type for relay monitoring"
git commit -m "Fix: Add maxLength to deviceToken in DeviceRegistration"

# Bad commit messages
git commit -m "Update stuff"
git commit -m "Fix"
```

### 6. Push and Create PR

```bash
git push origin feature/add-new-type
```

Then create a Pull Request on GitHub with:
- Clear description of changes
- Rationale for the change
- Impact on other components
- Version bump recommendation (major/minor/patch)

## Versioning Guidelines

This package follows [Semantic Versioning](https://semver.org/):

### Major Version (x.0.0)

**Breaking changes requiring coordinated release**

Examples:
- Removing a field from an existing type
- Changing field type (e.g., string → number)
- Adding a new required field
- Renaming fields or types

**Coordination Required:**
- Desktop daemon
- Relay service
- Mobile apps (iOS & Android)
- Hook script

Document migration path in CHANGELOG.md.

### Minor Version (0.x.0)

**New features, backwards compatible**

Examples:
- Adding new optional fields
- Adding new types
- Expanding enum values (with care)

**Coordination:**
- Desktop and relay can update independently
- Mobile apps add support for new features when ready

### Patch Version (0.0.x)

**Bug fixes and documentation only**

Examples:
- Documentation improvements
- JSDoc comment updates
- Fixing typos in descriptions
- Schema validation error message improvements

**Coordination:**
- Any component can update independently
- No API or behavior changes

## Code Standards

### TypeScript Style

- Use `interface` for type definitions, not `type`
- Include JSDoc comments for all fields
- Use explicit types, avoid `any`
- Prefer union types over enums for values

### JSON Schema Style

- One schema per type
- Use meaningful descriptions
- Set appropriate `maxLength` for strings (be generous but bounded)
- Use `format` validators where applicable (date-time, email, etc.)

### Documentation Style

- Write for both TypeScript and mobile developers
- Include examples with realistic data
- Document enum values explicitly
- Note which components use each type

## Mobile Implementation Reference

When adding or modifying types, update the "Mobile Implementation Reference" section in `README.md`. Mobile developers rely on this for implementing Swift and Kotlin equivalents.

Include:
- Field name and type mapping
- Required vs optional designation
- Example values
- Special handling notes (e.g., ISO 8601 timestamp parsing)

## Questions?

If you have questions about contributing:
- Open a GitHub Discussion
- Review existing types for examples
- Check `README.md` for type usage documentation
- See `PUBLISHING.md` for release process

Thank you for helping maintain the AgentWatch protocol! 🚀
