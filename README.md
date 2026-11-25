# Jordan — Video Editor Portfolio

A single-page portfolio showcasing Jordan's video editing work, services, process, and contact details.

## View locally

Open `index.html` in a modern web browser. No build step or package installation is required.

## Project structure

- `index.html` — portfolio page, styles, and interactions
- `assets/images/` — original image assets
- `assets/images/web/` — compressed WebP versions used by the page (~95% smaller)

## Adding or reordering videos

All reel videos come from the `PROJECTS` list near the top of the `<script>` in `index.html`.
Add one line per video (`cat`: `featured`, `product`, `short` or `commercial`; optional `poster`, `lang`, `wide`).
Filters, clip numbers, counts and the lightbox update on their own.
- `assets/video/` — portfolio reels and introduction video

## Git LFS

Video files are stored with [Git LFS](https://git-lfs.com/) because one source file exceeds GitHub's regular 100 MB file limit. After cloning, install Git LFS and run:

```sh
git lfs install
git lfs pull
```

## Contact

[j0rdanarrivado@gmail.com](mailto:j0rdanarrivado@gmail.com)
