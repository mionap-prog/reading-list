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
{ id, title, author, reader, status, ownership, language, startDate, endDate, rating, note }
```

- `id`: number from `Date.now()`
- `reader`: `"me"` or `"daughter"`
- `status`: `"to-read"`, `"reading"` or `"finished"`
- `ownership`: `"owned"`, `"borrowed"`, `"library"` or `""` (empty for old books)
- `language`: `"de"` (Deutsch), `"en"` (English), `"sr"` (Srpski) or `""` (not set, and what old books get). The labels live in `LANGUAGE_LABELS` in `app.js`.
- `startDate`, `endDate`: `"YYYY-MM-DD"` text, or `""` if not set
- `rating`: 0 to 5 (0 means not rated)
- `note`: short text, up to 200 characters

`loadBooks()` runs `migrateBooks()`, which fills in missing `ownership`, `language`, `startDate` and `endDate` on old books. Before the first upgrade it copies the raw saved text to `readinglist.books.backup`.

### Other storage keys

- `readinglist.books.backup`: a copy of the raw saved books text, written once before the first upgrade.
- `readinglist.goals`: yearly reading goals, `{ "me": { "2026": 30 }, "daughter": { ... } }`. Keys are years (`YYYY`) and values are whole numbers from 1 to 999. Old years stay stored, but only the current year is shown.

### Reader names

`"me"` and `"daughter"` are the stored values. Miona and Sena are display labels only, set in `READER_NAMES` in `app.js`. Never store the names in localStorage.

### Date rules

- Dates are `"YYYY-MM-DD"` text. "Today" is built from local time (not `toISOString()`, which uses UTC).
- In the edit dialog: switching to Reading fills `startDate` with today if empty and clears `endDate`. Switching to Read fills `endDate` with today if empty. Switching to Want to read clears both dates. A Read book keeps its start date.
- `endDate` is shown and editable only for Read books. It cannot be before `startDate`.
- A book counts toward the yearly challenge when it is Read and its `endDate` starts with the current year. Old Read books with no `endDate` don't count.
- The list shows "Read in N days" for Read books with both dates, counting both days.

### Reading and writing data

Use `loadBooks()` and `saveBooks()` in `app.js` to read and write books, and `loadGoals()` and `saveGoals()` for goals. Don't call localStorage directly elsewhere.

## Rules

- **No new libraries** (npm packages, CDN libraries, frameworks) without asking first.
- **Lowercase file names** only.
- **File links have no leading slash**: use `style.css` and `app.js`, not `/style.css`. A leading slash breaks the site on GitHub Pages, which serves from a sub-path.
- **Nothing sensitive in localStorage.** Only book data (titles, authors, status, and so on) and reading goals (plain numbers). No passwords, tokens or personal details.
- **No scripts from other websites.** Load only the local `app.js`.
- **Show typed text with `textContent`, never `innerHTML`**, so user input can't inject markup or scripts.

## Workflow

- Preview with Go Live (open `index.html`). No build or install is needed.
- Deploying means pushing to GitHub; GitHub Pages serves the files as they are.
