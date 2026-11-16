# Reading List: build plan

## Context
The repo has only a starter page (`index.html`, `style.css`, `app.js` with a comment). The goal is a reading list where the user and their daughter track books. First version features: add/remove books, reader per book, reading status, rating and notes. The two readers are shown as tabs (Me / Daughter / All). The site is live on GitHub Pages (https://mionap-prog.github.io/reading-list/).

Constraints from `CLAUDE.md`: only `index.html`, `style.css`, `app.js`; no new libraries; lowercase file names; links without leading slash; nothing sensitive in localStorage; no external scripts; user text shown with `textContent`, never `innerHTML`.

## Data model (localStorage, key `readinglist.books`)
Array of books:
```
{ id, title, author, reader: "me" | "daughter",
  status: "to-read" | "reading" | "finished",
  rating: 0-5, note: "" }
```
`id` comes from `Date.now()` (unique enough for a personal list). Only book data is stored.

## Steps (one commit each, pushed to main)
1. ✅ Done: **Storage helpers** in `app.js`: `loadBooks()` (try/catch around `JSON.parse`, fall back to `[]`) and `saveBooks(books)`. Keep one in-memory `books` array and a `render()` function.
2. ✅ Done: **Add-book form** in `index.html` (title, author, reader select, Add button). In `app.js`, a submit handler validates a non-empty title, pushes the new book with status `to-read`, saves and re-renders.
3. ✅ Done: **Book list rendering**: `render()` clears the list container and builds each item with `document.createElement` and `textContent` (never `innerHTML`). Shows an empty-state message when there are no books.
4. ✅ Done: **Remove button** on each book: filters it out by `id`, saves, re-renders (with a `confirm()` prompt).
5. ✅ Done: **Reader tabs**: buttons for All / Me / Daughter above the list. The selected tab is a variable used to filter in `render()`. The active tab gets a class and `aria-selected`. The form's reader select defaults to the active tab.
6. ✅ Done: **Status control**: a `<select>` on each book (to read / reading / finished) that updates the book and re-renders.
7. ✅ Done: **Rating and notes**: shown for finished books. A 1-5 star rating (buttons, set with `textContent`) and a short note field saved on change.
8. ✅ Done: **Styling** in `style.css`: card per book, tab bar, status badge colours, mobile-friendly layout. Colour is not the only status indicator (the badge also has text).
9. ✅ Done: **Update `CLAUDE.md`** with the data model and the localStorage key.
10. ✅ Done: **Reader names** (feature 3). Add `READER_NAMES = { me: "Miona", daughter: "Sena" }` and use it for the tab labels, the form's reader dropdown, the reader text on each book and the intro line in `index.html` ("Books for Miona and Sena"). Tabs: All / Miona / Sena. Replaces `READER_LABELS`. No data change.
11. ✅ Done: **Status names and list order** (feature 8). Change the status labels to "Want to read", "Reading", "Read" (stored values unchanged). In `render()`, sort the visible books Reading first, Want to read second, Read last. Use a stable sort so books in the same group keep their order.
12. ✅ Done: **Safe data upgrade.** In `loadBooks()`, add `migrateBooks(list)`: fill in missing `ownership` (""), `startDate` ("") and `endDate` ("") on old books. It is safe to run on every load, and it does not touch other fields. Before the first upgrade, copy the raw saved text to `readinglist.books.backup` if that key is empty. Invisible step, tested in the console.
13. ✅ Done: **Ownership, part 1** (feature 1). Add an Owned / Borrowed / Library dropdown to the add form (default Owned) and show the ownership text in each book's detail line. Old books show nothing until edited.
14. ✅ Done: **Edit panel, ownership part 2** (feature 1). Add an Edit button to each book that opens a native `<dialog>` form with title, author, reader, ownership and status, plus Save and Cancel. The inline status dropdown is removed from the book at the same time, so status is changed only here.
15. ✅ Done: **Rating and Remove move into the edit panel.** Reuse the star loop and `removeBook(id)`. The book itself no longer shows stars or a Remove button. The rating is not shown on the book again until step 16.
16. ✅ Done: **One-line rows** (feature 6). Restyle `.book` in `style.css` and `render()`: no cards, one row per book separated by thin lines. Line 1: title and author. Line 2: reader, status, ownership (and the rating if set, shown as stars such as "★★★★☆" in the details line, with an accessible text of "4 of 5 stars" for screen readers, for example a visually hidden or `aria-label` text, not the star characters being read out). Edit button on the right. Status stays readable as text, with a small colour marker. Tap targets at least 44 px, no horizontal scroll at 375 px.
17. ✅ Done: **Reading dates** (feature 2). Add Start and End date fields to the edit panel.
    - Switching to Reading fills the start date with today if empty. Switching to Read fills the end date with today if empty. You can change either date.
    - End date is shown and editable only when the status is Read. Moving away from Read clears the end date. Moving to Want to read clears both dates. A Read book keeps its start date.
    - End cannot be before start (the date picker's `min` plus a check on save).
    - The row shows the dates and, for Read books with both dates, how long it took ("Read in 11 days", counting both days).
18. ✅ Done: **Hidden notes** (feature 7). Remove the inline note input. A book with a note shows a small note icon button (with an aria-label), and clicking it opens a small dialog that shows the note as plain text. The edit panel has an "Add note" / "Edit note" button that opens the same dialog with a textarea (max 200 characters). Notes work for books in any status, not only finished ones. Text is set with `textContent` and `.value`, never `innerHTML`.
20. ✅ Done: **Yearly challenge** (feature 5). Add a Challenge section above the list. For each reader: goal for the current year (number input and Save), a progress line such as "Sena: 12 of 30 books this year" and a native `<progress>` bar. With no goal, it shows "No goal set for this year". Goals are saved in `readinglist.goals` through new `loadGoals()` and `saveGoals()` helpers that copy the error handling in `loadBooks()` and `saveBooks()`. The count is the number of Read books for that reader whose `endDate` is in the current year. (There is no monthly challenge; step 19 was dropped and the numbering was left as it is.)
21. ✅ Done: **Update `CLAUDE.md`** with the new fields, the two new storage keys, the reader-name labels and the date rules.
22. ✅ Done: **Language** (new field). Each book gets a language: Deutsch, English or Srpski.
    - New field `language` on every book. Stored values are `"de"`, `"en"`, `"sr"` or `""` (empty means not set, and is what old books get). The labels Deutsch, English and Srpski live in a `LANGUAGE_LABELS` object, like `OWNERSHIP_LABELS`.
    - Add `language: ""` to `NEW_BOOK_FIELDS` so `migrateBooks()` fills it in on old books. Old books without a language must still load and show no language, and the backup behaviour does not change.
    - The add form has a Language dropdown with a "Not set" option first, then Deutsch, English and Srpski. New books save the chosen value.
    - The edit dialog has the same dropdown (filled with `fillOptions()`), shows the book's current language, and saves the change on Save.
    - The book's details line shows the language label after the ownership, only when a language is set.
    - Text is set with `textContent`, never `innerHTML`.
    - Update the data model in `CLAUDE.md` with the `language` field, its stored values and the migration.

## Files to modify
- `index.html`: form, tab bar, list container
- `app.js`: all logic
- `style.css`: layout and styling
- `CLAUDE.md`: data model note

## Verification
- Open `index.html` with Go Live. Add books for both readers, switch tabs, change status, rate, add a note, remove a book; reload and confirm the data persists.
- Type `<b>test</b>` as a title and confirm it shows as literal text.
- Clear localStorage, and set the key to invalid JSON, to confirm the app still loads.
- Language: pick a language when adding a book and change it in the edit dialog. It shows in the details line and survives a reload. Old books without a language still load and show none.
- Check at phone width.
- Confirm no `innerHTML` in `app.js` (`grep innerHTML app.js`) and no external `<script src>`.
- After pushing, check the live GitHub Pages URL.

## Data model after steps 10-20 (`readinglist.books`)
```
{ id, title, author,
  reader: "me" | "daughter",                     // stored values do not change
  status: "to-read" | "reading" | "finished",    // stored values do not change
  ownership: "owned" | "borrowed" | "library" | "",   // new, "" for old books
  startDate: "YYYY-MM-DD" | "",                   // new
  endDate: "YYYY-MM-DD" | "",                     // new
  rating: 0-5, note: "" }
```
- New key `readinglist.goals`: `{ "me": { "2026": 30 }, "daughter": { ... } }`. Keys are years (`YYYY`). Old goals stay stored, but only the current year is shown.
- New key `readinglist.books.backup`: a copy of the raw saved text, written once before the first upgrade.
- **Reader names:** `"me"` and `"daughter"` stay as the stored values. Miona and Sena are display labels only (`READER_NAMES`), so old books show the new names with no data rewrite and no personal names in localStorage.
- **Dates:** stored as `YYYY-MM-DD` text, with "today" built from local time (not `toISOString()`, which uses UTC). A book counts for a year when its `endDate` starts with that year.

## Notes for steps 10-22
- The app never had a `source` field, so ownership is a new field and there is nothing to migrate.
- Old finished books have no end date, so they don't count toward any challenge until an end date is added in the edit panel.
- Step 22 (Language) is a per-book field, not a translation of the app. Keep labels in constant objects (like `STATUS_LABELS`, `OWNERSHIP_LABELS` and `LANGUAGE_LABELS`). Miona and Sena are names, shown through `READER_NAMES`.
- The live site and repo are public, so the names Miona and Sena will be visible in `app.js`.
- Past yearly goals are kept in storage, but there is no history view.

## Verification for steps 10-21 (after every step, in Go Live)
- **Upgrade safety (steps 12-13):** in the console, save old-format books (no ownership or dates), invalid JSON, and an empty list. Reload each time. Confirm every old book still appears under the right name, the backup key holds the original text, and nothing is lost.
- Add, edit, change status and remove books for both readers. Reload and confirm the data persists.
- Order: Reading, then Want to read, then Read, after each status change.
- Dates: auto-fill on Reading and Read, an end date before the start date is rejected, moving away from Read clears the end date, and a Read book keeps its start date.
- Challenges: set a yearly goal for both readers, finish a book and see progress and the bar change. Change a book's end date to last year and confirm it leaves the count. Check a new year by editing the stored goal key.
- Type `<b>test</b>` as a title and as a note: both show as literal text. `grep innerHTML app.js` finds nothing.
- Resize to 375 px wide (browser dev tools): no sideways scrolling, rows and buttons are easy to tap.
- After pushing, open the live GitHub Pages site and repeat a quick add, edit and reload.
