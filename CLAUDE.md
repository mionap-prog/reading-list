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

## Data model

Books are saved in localStorage under the key `readinglist.books` as an array of objects:

```
{ id, title, author, reader, status, rating, note }
```

- `id`: number from `Date.now()`
- `reader`: `"me"` or `"daughter"`
- `status`: `"to-read"`, `"reading"` or `"finished"`
- `rating`: 0 to 5 (0 means not rated)
- `note`: short text, up to 200 characters

Use `loadBooks()` and `saveBooks()` in `app.js` to read and write the data. Don't call localStorage directly elsewhere.

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
