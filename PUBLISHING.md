# Publishing Guide

## Prerequisites

### 1. Setup npm Trusted Publishing (Recommended - No Secrets Required!)

npm now supports trusted publishing via GitHub OIDC, which is more secure than long-lived tokens.

1. **Create npm account** at https://www.npmjs.com (if you don't have one)

2. **First-time publish** (manual, one-time only):
   ```bash
   npm login
   npm publish --access public
   ```

3. **Configure Trusted Publishing on npm**:
   - Go to https://www.npmjs.com/package/@agentwatch/protocol/access
   - Scroll to "Publishing access" section
   - Click "Configure trusted publishing"
   - Add GitHub Actions as a trusted publisher:
     - Repository: `RychidM/agentwatch-protocol`
     - Workflow: `publish.yml`
     - Environment: leave blank (or specify if using environments)
   - Save configuration

4. **Done!** Future releases use GitHub's OIDC - no secrets needed

### Alternative: Using Access Tokens (Legacy)

If you prefer traditional tokens:

1. Create automation token at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add as GitHub secret `NPM_TOKEN` in repository settings
3. Update workflow to use `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`

## Publishing a New Version

### 1. Update version in package.json

```bash
# For patch releases (bug fixes)
npm version patch

# For minor releases (new features, backwards compatible)
npm version minor

# For major releases (breaking changes)
npm version major
```

### 2. Push the tag to GitHub

```bash
git push origin main --tags
```

### 3. Automated publishing

The GitHub Action will automatically:
- Install dependencies
- Run type checking
- Build the package
- Publish to npm with provenance

### 4. Verify publication

```bash
# Check on npm
npm view @agentwatch/protocol

# Install in another project with npm
npm install @agentwatch/protocol

# Or with yarn
yarn add @agentwatch/protocol
```

## Version Strategy

Follow semantic versioning as documented in README.md:

- **Major (x.0.0)**: Breaking changes - requires coordinated release
- **Minor (0.x.0)**: New optional fields - backwards compatible
- **Patch (0.0.x)**: Documentation or validator fixes - no API changes

Update CHANGELOG.md before each release.
