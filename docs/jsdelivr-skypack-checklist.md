# Gridix — jsDelivr & Skypack Publish Checklist

jsDelivr and Skypack serve files automatically from npm and GitHub. Publishing to npm (see `npm-publish-checklist.md`) is the prerequisite for both.

---

## jsDelivr

jsDelivr mirrors every npm package automatically. No registration required.

### How it works

Once `gridix` is published to npm, jsDelivr serves it within ~15 minutes at:

```
https://cdn.jsdelivr.net/npm/gridix@<version>/<path>
```

### Verification

- [ ] Publish Gridix to npm (see `npm-publish-checklist.md`)
- [ ] Wait ~15 minutes after the npm publish
- [ ] Verify the CDN entry point loads:
  ```
  https://cdn.jsdelivr.net/npm/gridix@1.0.0/dist/scripts/gridix.cdn.min.js
  ```
- [ ] Verify the CSS loads:
  ```
  https://cdn.jsdelivr.net/npm/gridix@1.0.0/dist/styles/gridix.min.css
  ```
- [ ] Verify the ESM module loads:
  ```
  https://cdn.jsdelivr.net/npm/gridix@1.0.0/dist/scripts/gridix.esm.js
  ```

### Usage examples for documentation

```html
<!-- CDN IIFE — AEM / no build step -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/gridix@1.0.0/dist/styles/gridix.min.css">
<script src="https://cdn.jsdelivr.net/npm/gridix@1.0.0/dist/scripts/gridix.cdn.min.js" defer></script>
```

```html
<!-- Always latest patch of 1.x (use with care) -->
<script src="https://cdn.jsdelivr.net/npm/gridix@^1/dist/scripts/gridix.cdn.min.js" defer></script>
```

### SRI hash generation (optional but recommended)

SRI (Subresource Integrity) hashes let browsers verify the CDN file has not been tampered with.

```bash
# Generate an SRI hash for a specific file
curl -sL https://cdn.jsdelivr.net/npm/gridix@1.0.0/dist/scripts/gridix.cdn.min.js \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

Then use it in HTML:

```html
<script
  src="https://cdn.jsdelivr.net/npm/gridix@1.0.0/dist/scripts/gridix.cdn.min.js"
  integrity="sha384-<hash>"
  crossorigin="anonymous"
  defer
></script>
```

### jsDelivr GitHub source (alternative to npm)

jsDelivr can also serve directly from GitHub releases without an npm publish:

```
https://cdn.jsdelivr.net/gh/<username>/gridix@<tag>/<path>
```

- [ ] Create a GitHub release tagged `v1.0.0` with the `dist/` folder committed to the branch
- [ ] Verify: `https://cdn.jsdelivr.net/gh/adityakahb/gridix@v1.0.0/dist/scripts/gridix.cdn.min.js`

---

## Skypack

Skypack (now `esm.sh` redirect) serves ES module builds from npm packages.

> **Note:** Skypack.dev rebranded and merged into [esm.sh](https://esm.sh) in 2023. Both URLs remain functional.

### How it works

Once the npm package is published, Skypack / esm.sh automatically serves it as a browser-native ES module:

```
https://cdn.skypack.dev/gridix@<version>
https://esm.sh/gridix@<version>
```

### Verification

- [ ] Publish Gridix to npm
- [ ] Verify the Skypack URL resolves:
  ```
  https://cdn.skypack.dev/gridix@1.0.0
  ```
- [ ] Verify the esm.sh URL resolves:
  ```
  https://esm.sh/gridix@1.0.0
  ```
- [ ] Test an import in a browser module script:
  ```html
  <script type="module">
    import { GridixTable } from 'https://esm.sh/gridix@1.0.0';
    // use GridixTable
  </script>
  ```

### Requirements for Skypack / esm.sh compatibility

These are already satisfied by Gridix, but verify before each publish:

- [ ] `"module"` field in `package.json` points to a valid ESM file (`dist/scripts/gridix.esm.js`)
- [ ] The ESM build uses only standard ES module syntax (`import`/`export`), not CJS (`require`/`module.exports`)
- [ ] `"exports"` map in `package.json` includes an `"import"` condition pointing to the ESM build
- [ ] `"sideEffects": false` is set (allows tree-shaking on the CDN edge)
- [ ] No Node.js built-ins are imported (the library is browser-only)

---

## unpkg (bonus)

unpkg is another npm CDN that mirrors packages automatically:

```
https://unpkg.com/gridix@1.0.0/dist/scripts/gridix.cdn.min.js
https://unpkg.com/gridix@1.0.0/dist/styles/gridix.min.css
```

- [ ] Verify the unpkg URLs are live after the npm publish

---

## CDN URL summary table

| CDN | URL pattern | Availability |
|-----|-------------|-------------|
| jsDelivr (npm) | `https://cdn.jsdelivr.net/npm/gridix@{ver}/{path}` | ~15 min after npm publish |
| jsDelivr (GitHub) | `https://cdn.jsdelivr.net/gh/adityakahb/gridix@{tag}/{path}` | After GitHub release |
| esm.sh | `https://esm.sh/gridix@{ver}` | ~15 min after npm publish |
| Skypack | `https://cdn.skypack.dev/gridix@{ver}` | ~15 min after npm publish |
| unpkg | `https://unpkg.com/gridix@{ver}/{path}` | Immediate after npm publish |
