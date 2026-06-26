# Gridix — npm Publish Checklist

Use this checklist before publishing or updating Gridix on npm.

---

## Pre-publish verification

- [ ] `package.json` fields are complete and accurate:
  - [ ] `name` is `gridix` (run `npm info gridix` to check availability if first publish)
  - [ ] `version` is bumped correctly (follow [semver](https://semver.org): patch/minor/major)
  - [ ] `description`, `keywords`, `author`, `license` are set
  - [ ] `repository.url` points to the correct GitHub repo
  - [ ] `bugs.url` and `homepage` are correct
  - [ ] `main`, `module`, `types`, `exports` all point to existing `dist/` files
  - [ ] `"sideEffects": false` is present (enables tree-shaking)
  - [ ] `"files"` lists only what consumers need: `["dist", "src/connectors"]`
- [ ] No `node_modules`, `coverage`, `demos`, or `.env` files are included (verify with `npm pack --dry-run`)
- [ ] A `LICENSE` file (MIT) exists at the repo root
- [ ] `CHANGELOG.md` or release notes exist and are up to date

## Build verification

- [ ] Run `npm run clean && npm run build` — all 10 output files generated cleanly:
  - `dist/scripts/gridix.esm.js` + `.map`
  - `dist/scripts/gridix.esm.min.js`
  - `dist/scripts/gridix.cjs.js` + `.map`
  - `dist/scripts/gridix.cjs.min.js`
  - `dist/scripts/gridix.umd.js` + `.map`
  - `dist/scripts/gridix.umd.min.js`
  - `dist/scripts/gridix.cdn.js` + `.map`
  - `dist/scripts/gridix.cdn.min.js`
  - `dist/styles/gridix.css` + `.map`
  - `dist/styles/gridix.min.css`
  - `dist/gridix.d.ts`
- [ ] Run `npm test` — all tests pass (225 tests across 14 files)
- [ ] Run `npm run lint` — no ESLint errors
- [ ] Run `npm run lint:css` — no Stylelint errors

## Security & quality

- [ ] Run `npm audit` — no critical or high vulnerabilities in dependencies
- [ ] Source does not contain any hardcoded secrets, API keys, or internal URLs
- [ ] XSS prevention confirmed: `highlightCells` uses DOM API only, no `innerHTML` with user input
- [ ] CSV injection prevention confirmed: export functions prefix dangerous cell values

## npm account setup (first publish only)

- [ ] Create an account at [npmjs.com](https://www.npmjs.com/)
- [ ] Enable two-factor authentication (2FA) on your npm account
- [ ] Run `npm login` in the terminal and authenticate
- [ ] Verify you are logged in: `npm whoami`

## Scoped package (optional)

If publishing as a scoped package (e.g. `@yourscope/gridix`):

- [ ] Update `"name"` in `package.json` to `"@yourscope/gridix"`
- [ ] Run `npm publish --access public` (scoped packages default to private)

## Publishing steps

```bash
# 1. Confirm you're on the correct branch (main / release)
git checkout main
git pull origin main

# 2. Clean build
npm run clean
npm run build

# 3. Run all checks
npm test
npm run lint
npm run lint:css

# 4. Dry-run to inspect the tarball contents
npm pack --dry-run

# 5. Publish
npm publish

# 6. Tag the release in git
git tag v1.0.0
git push origin v1.0.0
```

## Post-publish verification

- [ ] Visit `https://www.npmjs.com/package/gridix` — verify the version, description, and README appear correctly
- [ ] Run `npm install gridix` in a fresh project and import it to confirm the package resolves correctly
- [ ] Verify the CDN URL is live on jsDelivr within ~15 minutes:
  `https://cdn.jsdelivr.net/npm/gridix@1.0.0/dist/scripts/gridix.cdn.min.js`
- [ ] Verify on unpkg: `https://unpkg.com/gridix@1.0.0/dist/scripts/gridix.cdn.min.js`

## Version bumping (subsequent releases)

```bash
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
npm version minor   # 1.0.0 → 1.1.0 (new features, backwards-compatible)
npm version major   # 1.0.0 → 2.0.0 (breaking changes)
```

`npm version` automatically commits and tags in git. Push with `git push --follow-tags`.
