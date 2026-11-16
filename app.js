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

const bookList = document.getElementById("book-list");

const READER_LABELS = { me: "Me", daughter: "Daughter" };
const STATUS_LABELS = {
  "to-read": "To read",
  "reading": "Reading",
  "finished": "Finished"
};

// Draws the book list on the page. Typed text is always set with textContent.
function render() {
  bookList.replaceChildren();

  if (books.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No books yet. Add your first one above.";
    bookList.appendChild(empty);
    return;
  }

  books.forEach(function (book) {
    const item = document.createElement("li");
    item.className = "book";

    const title = document.createElement("strong");
    title.textContent = book.title;
    item.appendChild(title);

    if (book.author) {
      const author = document.createElement("span");
      author.textContent = " by " + book.author;
      item.appendChild(author);
    }

    const details = document.createElement("div");
    details.className = "details";
    details.textContent =
      (READER_LABELS[book.reader] || book.reader) + " · " +
      (STATUS_LABELS[book.status] || book.status);
    item.appendChild(details);

    bookList.appendChild(item);
  });
}

const addForm = document.getElementById("add-form");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const readerSelect = document.getElementById("reader");

addForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (title === "") {
    titleInput.focus();
    return;
  }

  books.push({
    id: Date.now(),
    title: title,
    author: authorInput.value.trim(),
    reader: readerSelect.value,
    status: "to-read",
    rating: 0,
    note: ""
  });

  saveBooks(books);
  render();

  addForm.reset();
  titleInput.focus();
});

render();
