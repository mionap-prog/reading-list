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
1. **Storage helpers** in `app.js`: `loadBooks()` (try/catch around `JSON.parse`, fall back to `[]`) and `saveBooks(books)`. Keep one in-memory `books` array and a `render()` function.
2. **Add-book form** in `index.html` (title, author, reader select, Add button). In `app.js`, a submit handler validates a non-empty title, pushes the new book with status `to-read`, saves and re-renders.
3. **Book list rendering**: `render()` clears the list container and builds each item with `document.createElement` and `textContent` (never `innerHTML`). Shows an empty-state message when there are no books.
4. **Remove button** on each book: filters it out by `id`, saves, re-renders (with a `confirm()` prompt).
5. **Reader tabs**: buttons for All / Me / Daughter above the list. The selected tab is a variable used to filter in `render()`. The active tab gets a class and `aria-selected`. The form's reader select defaults to the active tab.
6. **Status control**: a `<select>` on each book (to read / reading / finished) that updates the book and re-renders.
7. **Rating and notes**: shown for finished books. A 1-5 star rating (buttons, set with `textContent`) and a short note field saved on change.
8. **Styling** in `style.css`: card per book, tab bar, status badge colours, mobile-friendly layout. Colour is not the only status indicator (the badge also has text).
9. **Update `CLAUDE.md`** with the data model and the localStorage key.
10. **Language** (new feature): a language dropdown at the top of the page with three choices: Deutsch, English, Srpski.
    - All visible text (headings, labels, buttons, tab names, status names, messages) is looked up in a `translations` object in `app.js`, with one entry per language. English is the default.
    - Static text in `index.html` is marked with `data-i18n` attributes and filled in with `textContent`. Text built in `render()` uses the same lookup.
    - The chosen language is saved in localStorage under `readinglist.language` (a language code only, nothing sensitive) and restored on load. Changing the language re-renders the page straight away.
    - Book data (titles, authors, notes) is never translated, and the stored status and reader values stay the same (`"to-read"`, `"me"`, and so on). Only their displayed labels change.
    - Set `<html lang>` to match the chosen language.
    - Update `CLAUDE.md` with the language key and how to add a text string.

## Files to modify
- `index.html`: form, tab bar, list container
- `app.js`: all logic
- `style.css`: layout and styling
- `CLAUDE.md`: data model note

## Verification
- Open `index.html` with Go Live. Add books for both readers, switch tabs, change status, rate, add a note, remove a book; reload and confirm the data persists.
- Type `<b>test</b>` as a title and confirm it shows as literal text.
- Clear localStorage, and set the key to invalid JSON, to confirm the app still loads.
- Switch between Deutsch, English and Srpski: all text changes, the choice survives a reload, and book data is unchanged.
- Check at phone width.
- Confirm no `innerHTML` in `app.js` (`grep innerHTML app.js`) and no external `<script src>`.
- After pushing, check the live GitHub Pages URL.
