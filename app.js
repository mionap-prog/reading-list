// Reading List app logic.

const STORAGE_KEY = "readinglist.books";

// Read the saved books. Falls back to an empty list if nothing is saved,
// the saved data is not valid JSON, or localStorage is unavailable.
function loadBooks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

// Save the books. Returns false if saving failed (for example, storage is full or blocked).
function saveBooks(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (error) {
    return false;
  }
}

// The single in-memory list of books.
let books = loadBooks();

// Draws the book list on the page. Filled in by later steps.
function render() {}

render();
