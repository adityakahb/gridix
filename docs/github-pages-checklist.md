# Gridix — GitHub Pages Publish Checklist

Use this checklist to publish the Gridix demo site at `https://<username>.github.io/gridix`.

---

## Overview

GitHub Pages will serve static files directly from a branch or folder in the repository. The demos directory is the intended public site — it imports from `../dist/` paths which must also be present in the deployed branch.

---

## Repository setup

- [ ] The repository is public (GitHub Pages is free for public repos; paid plan required for private)
- [ ] The repo is named `gridix` (determines the URL: `https://<username>.github.io/gridix`)
- [ ] The `main` branch is the default branch

## Build the distribution files

```bash
npm run clean
npm run build
npm test   # confirm all tests pass before deploying
```

- [ ] `dist/` directory is up to date with the latest build

## Option A — Deploy from `gh-pages` branch (recommended)

This approach keeps the `main` branch clean and deploys only what the site needs.

```bash
# Install gh-pages helper (one-time)
npm install --save-dev gh-pages

# Add deploy script to package.json:
# "deploy": "gh-pages -d . -s 'demos/**/* dist/**/*'"
# Then:
npm run deploy
```

Or manually:

```bash
# 1. Create / switch to gh-pages branch
git checkout --orphan gh-pages
git reset --hard

# 2. Copy the needed files
cp -r /path/to/dist ./dist
cp -r /path/to/demos ./demos

# 3. Commit and push
git add dist demos
git commit -m "deploy: GitHub Pages v1.0.0"
git push origin gh-pages --force

# 4. Return to main
git checkout main
```

## Option B — Deploy from `main` branch `/docs` folder

> **Note:** This requires renaming the `demos/` directory to `docs/`, which conflicts with the existing `docs/` folder used for specification files. Option A is strongly recommended.

- [ ] (Not recommended for this project — use Option A)

## GitHub repository settings

- [ ] Go to **Settings → Pages** in the GitHub repository
- [ ] Under **Source**, select:
  - Branch: `gh-pages`
  - Folder: `/ (root)`
- [ ] Click **Save**
- [ ] Wait ~1–2 minutes for the initial deployment
- [ ] The published URL will be shown: `https://<username>.github.io/gridix`

## URL path correction for GitHub Pages

GitHub Pages serves the site under a sub-path (`/gridix/`), not at root (`/`). The demo HTML files reference assets with relative paths (e.g. `../dist/`), which work correctly when served from the `demos/` directory. Verify:

- [ ] All demo `<link>` and `<script>` `src` / `href` attributes use relative paths (e.g. `../dist/styles/gridix.min.css`), not absolute paths starting with `/`
- [ ] The `demos/index.html` hub links to other demos with relative paths (e.g. `./basic.html`)

## Post-deploy verification

- [ ] Visit `https://<username>.github.io/gridix/demos/index.html` and confirm the hub loads
- [ ] Verify each demo page loads without 404 errors on CSS or JS assets:
  - `basic.html` — sorting, search, pagination
  - `responsive.html` — natural-width detection
  - `aem.html` — CDN auto-init
  - `advanced.html` — row select, sticky header
  - `themes.html` — default / minimal / dark
  - `print.html` — print media
  - `lighthouse.html` — performance demo
- [ ] Open DevTools Network tab — no failed requests
- [ ] Run Lighthouse on the deployed URL and confirm scores match local results

## Updating the deployment

Whenever a new version is released:

```bash
npm run clean && npm run build && npm test
npm run deploy   # if using the gh-pages npm script
```

Or re-run the manual `gh-pages` branch steps with the updated `dist/` and `demos/` files.

## Custom domain (optional)

To serve from `gridix.yourdomain.com` instead of `<username>.github.io/gridix`:

- [ ] Add a `CNAME` file containing only the custom domain to the deployed branch root
- [ ] Create a DNS `CNAME` record pointing your domain to `<username>.github.io`
- [ ] Enable HTTPS in **Settings → Pages → Enforce HTTPS**
- [ ] Update `homepage` in `package.json` and `README.md` to the custom domain
