# Raghav Singh — Portfolio

Personal portfolio for Raghav Singh: B.A. (Hons) Economics student, web developer and digital artist.

- **Intro screen:** a retro pixel "desktop" with a big `PORTFOLIO` window, a draggable music player and a comic viewer showing Raghav's own artwork. Press **Enter** or tap the button to go in.
- **Main site:** a cream-and-ink cell grid. Panels snap to whole squares, empty squares flash as you hover, and clicking them draws on the grid. Sections cover the about text, experience, live web projects (embedded previews), art, Fiverr gigs, skills and contact.

It is a static site with no build step: plain HTML, CSS and JavaScript. [Lenis](https://github.com/darkroomengineering/lenis) is vendored for smooth scrolling.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on GitHub Pages

Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, and pick the branch with this code and the `/ (root)` folder.

## Editing

| What | Where |
| --- | --- |
| Text, links, Fiverr URL | `index.html` |
| Artwork | `assets/img/` (webp) |
| Styles | `assets/css/style.css` |
| Behaviour (intro, grid, menu, lightbox) | `assets/js/main.js` |

### Grid layout

Each block in `index.html` is placed on the grid with CSS variables on its `style` attribute:

- `--c` is the start column.
- `--w` is the width in columns.
- `--h` is the minimum height in rows. Text blocks grow automatically to fit their content.
- `--o` is the number of empty rows left above the block.

The desktop grid has 16 columns. Add `-md` (tablet, 10 columns) or `-sm` (phone, 6 columns) to any variable to change it at that size, for example `--w-sm:6`. Blocks flow into the first free rows in the columns they ask for.
