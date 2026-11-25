# Jordan — Video Editor Portfolio

A single-page portfolio showcasing Jordan's video editing work, services, process, and contact details.

## View locally

Open `index.html` in a modern web browser. No build step or package installation is required.

## Project structure

- `index.html` — portfolio page, styles, and interactions
- `projects.js` — the list of videos shown on the site
- `manager.html` — visual editor for `projects.js`
- `assets/images/` — original image assets
- `assets/images/web/` — compressed WebP versions used by the page (~95% smaller)

## Portfolio Manager (adding, editing or reordering videos)

All reel videos live in `projects.js`. Edit them visually with **`manager.html`**
(open `your-site/manager.html`, it isn't linked from the portfolio):

1. Add videos (or click one under **Unused videos**), edit titles, categories, language badges and thumbnails, drag to reorder, or hide a video without deleting it.
2. Changes save automatically in your browser. Use **Preview site** to see them before anyone else does.
3. Press **Publish…**, download `projects.js`, and upload or paste it over `projects.js` on GitHub. New video files go in `assets/video/`, thumbnails in `assets/images/web/`.

The manager can't change the live site by itself, so it's safe for it to be public: only a GitHub commit publishes anything.

## Git LFS

Video files are stored with [Git LFS](https://git-lfs.com/) because one source file exceeds GitHub's regular 100 MB file limit. After cloning, install Git LFS and run:

```sh
git lfs install
git lfs pull
```

## Contact

[j0rdanarrivado@gmail.com](mailto:j0rdanarrivado@gmail.com)
