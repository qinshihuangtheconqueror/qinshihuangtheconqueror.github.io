# Le Hoang Huy — Personal Portfolio ("Signal & Guardrail")

Static single-page editorial portfolio for **Le Hoang Huy** (`Lê Hoàng Huy`), **AI Full-stack Engineer** based in Hanoi, Vietnam. Built with plain HTML5, CSS3, and vanilla JavaScript—no framework, no build step, and no npm runtime dependencies.

## Files

- `index.html` — Semantic HTML5 markup, Google Fonts (`Bricolage Grotesque`, `Manrope`, `JetBrains Mono`), Open Graph metadata, inline SVG favicon (`LH`), hero `<canvas id="hero-graph">`, and inline SVG architecture diagrams for **HUSTVA** and **KMS**.
- `styles.css` — **"Signal & Guardrail"** design system (`--bg` `#070912`, `--signal` `#5eead4`, `--agent` `#a78bfa`, `--guard` `#fbbf24`) with `[data-theme="light"]` high-contrast overrides, aurora drift layers, film-grain SVG overlay, staggered hero load intro, glassmorphic metric tiles, spotlight cards with rotating conic borders, scroll-linked timeline, infinite skill marquee, and `prefers-reduced-motion` support down to 360px.
- `hero-graph.js` — Hero canvas background animation (`#hero-graph`, loaded with `defer` before `main.js`).
- `main.js` — Theme toggle with `localStorage` persistence (`try/catch`), mobile navigation menu, smooth anchor scrolling, scroll progress bar, sticky glass header, scroll-linked timeline progress, metric count-up observer, spotlight pointer tracking, magnetic buttons, and clipboard email copy with selection fallback.

## Preview Locally

### Option 1: Open directly in a browser
Double-click `portfolio\index.html` (or open it via `File -> Open File...` in any modern browser). All asset paths are relative, so it works over `file://` with zero setup.

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
