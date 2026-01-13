# Claude Setup Instructions

This document is for Claude to read when setting up this repository for the first time.

## Context

This is the `@blorkfield/blork-tabs` package - a framework-agnostic tab/panel management system with snapping and docking. The code has been extracted from overlay-core and needs to be set up for npm publishing.

## What's Already Done

- All source code is in `src/`
- TypeScript config (`tsconfig.json`) is ready
- Package.json is configured for `@blorkfield/blork-tabs`
- GitHub Actions workflows are in `.github/workflows/`
- README, LICENSE, and .gitignore are in place
- Default CSS styles are in `styles.css`

## Setup Steps for Claude

### 1. Verify the package builds

```bash
npm install
npm run build
```

If there are any TypeScript errors, fix them.

### 2. Questions to ask the user

Before proceeding with publishing setup, ask:

1. **npm authentication**: "Do you have an npm account and are you logged in? Run `npm whoami` to check."

2. **npm organization**: "Does the @blorkfield organization exist on npm? If not, you'll need to create it at npmjs.com."

3. **GitHub secrets**: "For automated publishing, you'll need to add an NPM_TOKEN secret to this repo's GitHub settings. Do you have an npm access token ready, or do you need to create one?"

### 3. Test local build

After `npm run build`, verify these files exist:
- `dist/index.js`
- `dist/index.mjs`
- `dist/index.d.ts`
- `dist/styles.css`

### 4. Set up npm publishing (manual first time)

For the first publish:
```bash
npm login  # if not already logged in
npm publish --access public
```

### 5. GitHub Actions Setup

The workflows are already configured. The user needs to:

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add a new secret called `NPM_TOKEN` with their npm access token

To create an npm token:
1. Go to npmjs.com → Access Tokens
2. Generate new token → Classic Token → Automation
3. Copy the token and add it as GitHub secret

### 6. Creating a Release

To publish a new version:
1. Update version in `package.json`
2. Commit: `git commit -am "chore: bump version to X.Y.Z"`
3. Tag: `git tag vX.Y.Z`
4. Push: `git push && git push --tags`
5. Create GitHub release from the tag
6. The publish workflow will automatically publish to npm

## After Setup

Once published, update overlay-core to use the npm package:

```bash
cd /path/to/overlay-core/test-app
npm install @blorkfield/blork-tabs
```

Then update `main.ts`:
```typescript
// Change from:
import { TabManager } from './blork-tabs/src';

// To:
import { TabManager } from '@blorkfield/blork-tabs';
```

## Troubleshooting

### Build fails
- Check TypeScript errors with `npx tsc --noEmit`
- Ensure all imports are correct

### Publish fails with 403
- Verify npm login: `npm whoami`
- Verify org exists: `npm org ls blorkfield`
- Check package name isn't taken

### GitHub Action fails
- Verify NPM_TOKEN secret is set correctly
- Check token hasn't expired
- Ensure token has publish permissions
