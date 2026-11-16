# Le Hoang Huy — Personal Portfolio

Static single-page portfolio for **Le Hoang Huy** (`Lê Hoàng Huy`), **AI Full-stack Engineer** based in Hanoi, Vietnam. Built with plain HTML5, CSS3, and vanilla JavaScript—no framework, no build step, and no external runtime dependencies.

## Files

- `index.html` — Semantic HTML5 markup, metadata, Open Graph tags, and inline SVG favicon (`LH`).
- `styles.css` — Responsive layout (down to 360px), dark/light theme tokens (`:root` and `[data-theme="light"]`), accessible focus states, and `prefers-reduced-motion` support.
- `main.js` — Theme toggle with `localStorage` persistence (`try/catch`), mobile navigation menu, smooth anchor scrolling, and `IntersectionObserver` scroll reveal.

## Preview Locally

### Option 1: Open directly in a browser
Double-click `portfolio\index.html` (or open it via `File -> Open File...` in any modern browser). All asset paths (`styles.css` and `main.js`) are relative, so it works over `file://` with zero setup.

### Option 2: Run a local static server (optional)
From the repository root or inside `portfolio/`:

```bash
# Using Python 3
python -m http.server 8080 --directory portfolio

# Or using Node.js (npx serve)
npx serve portfolio
```

Then open `http://localhost:8080` in your browser.

## Deploy

### Cloudflare Pages
1. Push the repository to GitHub or GitLab (or use **Direct Upload** in the Cloudflare dashboard).
2. In Cloudflare Dashboard -> **Workers & Pages** -> **Create application** -> **Pages**:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `portfolio`
3. Alternatively, deploy directly from the CLI with Wrangler:
   ```bash
   npx wrangler pages deploy portfolio --project-name le-hoang-huy-portfolio
   ```

### GitHub Pages
1. In your GitHub repository, go to **Settings** -> **Pages**.
2. Under **Build and deployment**:
   - Select **GitHub Actions** (or **Deploy from a branch** if `portfolio/` contents are placed at the root or `docs/`).
   - For a static workflow deploying the `portfolio` folder directly, set the artifact upload `path: ./portfolio` in `.github/workflows/static.yml`.

## Updating Placeholder Links

Search `index.html` for `<!-- TODO: real URL -->` to replace the placeholder `href="#"` attributes on the **GitHub** and **LinkedIn** links with production profile URLs.
