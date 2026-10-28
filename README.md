# Gamez Arcade — public website files

This repository contains only the built website in `site/` and its GitHub Pages workflow. The TypeScript source and room server live in the separate private `gamez-arcade-source` repository.

The site is built for `https://aminekhalef.github.io/gamez-arcade/`. GitHub Pages must use **GitHub Actions** as the publishing source.

You can add a custom domain later in the repository's Pages settings. Rebuild the website with `VITE_BASE_PATH=/` before switching the domain so asset links work at its root.

After the room server is deployed on Render, set `window.GAMEZ_API_ORIGIN` in `site/config.js` to its HTTPS origin, without a trailing slash. Until then, room creation cannot connect to the server.

The public website's compiled browser JavaScript can be viewed by visitors. This is normal for a web app; the original TypeScript source and Node server files are not included here.
