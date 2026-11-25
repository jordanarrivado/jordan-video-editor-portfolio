# Jordan — Video Editor Portfolio

A single-page portfolio showcasing Jordan's video editing work, services, process, and contact details.

## View locally

Open `index.html` in a modern web browser. No build step or package installation is required.

## Project structure

- `index.html` — portfolio page, styles, and interactions
- `projects.js` — the list of videos shown on the site
- `manager.html` — visual editor for `projects.js`
- `api/publish.js` — Vercel function behind the manager's one-click Publish
- `assets/images/` — original image assets
- `assets/images/web/` — compressed WebP versions used by the page (~95% smaller)

## Portfolio Manager (adding, editing or reordering videos)

All reel videos live in `projects.js`. Edit them visually with **`manager.html`**
(open `your-site/manager.html`, it isn't linked from the portfolio):

1. Add videos (or click one under **Unused videos**), edit titles, categories, language badges and thumbnails, drag to reorder, or hide a video without deleting it.
2. Changes save automatically in your browser. Use **Preview site** to see them before anyone else does.
3. Press **Publish**. The manager commits `projects.js` to GitHub through `api/publish.js` (a Vercel function), Vercel redeploys, and the page tells you when it's live. Tick **Remember on this device** and later publishes are one click.

New video files go in `assets/video/` and thumbnails in `assets/images/web/`, uploaded through GitHub.

### One-time setup for one-click publish

1. Create a [fine-grained GitHub token](https://github.com/settings/personal-access-tokens/new): only this repository, permission **Contents: Read and write**.
2. In Vercel, go to the project → **Settings → Environment Variables** and add:
   - `GITHUB_TOKEN`: the token
   - `ADMIN_PASSWORD`: the password you'll type in the manager
3. Redeploy the latest deployment.

Without these, the manager falls back to **Manual publish**: download or copy `projects.js` and commit it on GitHub yourself.

The publish endpoint only accepts the correct password, validates every field, and rebuilds `projects.js` itself, so it can't be used to write anything else to the repo. It also warns before overwriting a `projects.js` that was changed on GitHub after you opened the manager.

## Git LFS

Video files are stored with [Git LFS](https://git-lfs.com/) because one source file exceeds GitHub's regular 100 MB file limit. After cloning, install Git LFS and run:

```sh
git lfs install
git lfs pull
```

## Contact

[j0rdanarrivado@gmail.com](mailto:j0rdanarrivado@gmail.com)
