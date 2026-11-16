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
const tabButtons = document.querySelectorAll("#tabs button");

// Which tab is selected: "all", "me" or "daughter".
let currentTab = "all";

// Marks the selected tab for styling and screen readers.
function updateTabs() {
  tabButtons.forEach(function (button) {
    const isActive = button.dataset.reader === currentTab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

// Makes the form's reader dropdown match the selected tab (stays as is on "All").
function syncReaderSelect() {
  if (currentTab !== "all") {
    readerSelect.value = currentTab;
  }
}

tabButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    currentTab = button.dataset.reader;
    syncReaderSelect();
    render();
  });
});

const READER_LABELS = { me: "Me", daughter: "Daughter" };
const STATUS_LABELS = {
  "to-read": "To read",
  "reading": "Reading",
  "finished": "Finished"
};

// Removes a book by id after the user confirms.
function removeBook(id) {
  const book = books.find(function (b) { return b.id === id; });
  if (!book) return;

  if (!confirm("Remove \"" + book.title + "\" from the list?")) return;

  books = books.filter(function (b) { return b.id !== id; });
  saveBooks(books);
  render();
}

// Draws the book list on the page. Typed text is always set with textContent.
function render() {
  updateTabs();
  bookList.replaceChildren();

  const visibleBooks = books.filter(function (book) {
    return currentTab === "all" || book.reader === currentTab;
  });

  if (visibleBooks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = books.length === 0
      ? "No books yet. Add your first one above."
      : "No books here yet.";
    bookList.appendChild(empty);
    return;
  }

  visibleBooks.forEach(function (book) {
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
    details.textContent = READER_LABELS[book.reader] || book.reader;
    item.appendChild(details);

    const statusSelect = document.createElement("select");
    statusSelect.setAttribute("aria-label", "Status of " + book.title);
    Object.keys(STATUS_LABELS).forEach(function (value) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = STATUS_LABELS[value];
      statusSelect.appendChild(option);
    });
    statusSelect.value = book.status;
    statusSelect.addEventListener("change", function () {
      book.status = statusSelect.value;
      saveBooks(books);
      render();
    });
    item.appendChild(statusSelect);

    if (book.status === "finished") {
      const rating = document.createElement("div");
      rating.className = "rating";
      for (let star = 1; star <= 5; star++) {
        const starButton = document.createElement("button");
        starButton.type = "button";
        starButton.textContent = star <= book.rating ? "★" : "☆";
        starButton.setAttribute("aria-label", "Rate " + star + (star === 1 ? " star" : " stars"));
        starButton.addEventListener("click", function () {
          // Clicking the current rating again clears it.
          book.rating = book.rating === star ? 0 : star;
          saveBooks(books);
          render();
        });
        rating.appendChild(starButton);
      }
      item.appendChild(rating);

      const noteInput = document.createElement("input");
      noteInput.type = "text";
      noteInput.maxLength = 200;
      noteInput.placeholder = "Short note";
      noteInput.setAttribute("aria-label", "Note for " + book.title);
      noteInput.value = book.note;
      noteInput.addEventListener("change", function () {
        book.note = noteInput.value.trim();
        saveBooks(books);
      });
      item.appendChild(noteInput);
    }

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", function () {
      removeBook(book.id);
    });
    item.appendChild(removeButton);

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
  syncReaderSelect();
  titleInput.focus();
});

render();
