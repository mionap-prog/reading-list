# Reading List

A reading list app for tracking books for me and my daughter.

## Stack

- Plain HTML, CSS and JavaScript (no build step, no framework)
- Data saved in the browser's localStorage
- Hosted on GitHub Pages
- Previewed locally with the VS Code Go Live extension

## Files

Keep everything in these three files:

- `index.html`
- `style.css`
- `app.js`

Do not add other source files or folders without asking.

## Rules

- **No new libraries** (npm packages, CDN libraries, frameworks) without asking first.
- **Lowercase file names** only.
- **File links have no leading slash**: use `style.css` and `app.js`, not `/style.css`. A leading slash breaks the site on GitHub Pages, which serves from a sub-path.
- **Nothing sensitive in localStorage.** Only book data (titles, authors, status, and so on). No passwords, tokens or personal details.
- **No scripts from other websites.** Load only the local `app.js`.
- **Show typed text with `textContent`, never `innerHTML`**, so user input can't inject markup or scripts.

## Workflow

- Preview with Go Live (open `index.html`). No build or install is needed.
- Deploying means pushing to GitHub; GitHub Pages serves the files as they are.
