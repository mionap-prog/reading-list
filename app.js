// Reading List app logic.

const STORAGE_KEY = "readinglist.books";

// Display names only. The stored values stay "me" and "daughter".
const READER_NAMES = { me: "Miona", daughter: "Sena" };

const BACKUP_KEY = "readinglist.books.backup";

// Fields added after the first version, with the value old books get.
const NEW_BOOK_FIELDS = { ownership: "", startDate: "", endDate: "" };

// Fills in any missing new fields on old books. Safe to run on every load:
// it only adds fields that are missing and never changes other fields.
function migrateBooks(list) {
  return list.map(function (book) {
    if (book === null || typeof book !== "object") return book;
    const upgraded = Object.assign({}, book);
    Object.keys(NEW_BOOK_FIELDS).forEach(function (field) {
      if (!(field in upgraded)) upgraded[field] = NEW_BOOK_FIELDS[field];
    });
    return upgraded;
  });
}

// Read the saved books. Falls back to an empty list if nothing is saved,
// the saved data is not valid JSON, or localStorage is unavailable.
function loadBooks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [];

    // Keep a copy of the original text before the first upgrade (only if no backup exists yet).
    try {
      if (localStorage.getItem(BACKUP_KEY) === null) {
        localStorage.setItem(BACKUP_KEY, saved);
      }
    } catch (error) {
      // A failed backup must not stop the books from loading.
    }

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? migrateBooks(parsed) : [];
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

// Marks the selected filter button for styling and screen readers.
function updateTabs() {
  tabButtons.forEach(function (button) {
    const isActive = button.dataset.reader === currentTab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
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

const STATUS_LABELS = {
  "to-read": "Want to read",
  "reading": "Reading",
  "finished": "Read"
};

// Order of the groups in the list: Reading, then Want to read, then Read.
const STATUS_ORDER = { "reading": 0, "to-read": 1, "finished": 2 };

// Display labels for the ownership values. Old books have "" and show nothing.
const OWNERSHIP_LABELS = {
  "owned": "Owned",
  "borrowed": "Borrowed",
  "library": "Library"
};

// Removes a book by id after the user confirms. Returns true if it was removed.
function removeBook(id) {
  const book = books.find(function (b) { return b.id === id; });
  if (!book) return false;

  if (!confirm("Remove \"" + book.title + "\" from the list?")) return false;

  books = books.filter(function (b) { return b.id !== id; });
  saveBooks(books);
  render();
  return true;
}

// Draws the book list on the page. Typed text is always set with textContent.
function render() {
  updateTabs();
  bookList.replaceChildren();

  const visibleBooks = books.filter(function (book) {
    return currentTab === "all" || book.reader === currentTab;
  });

  // filter() made a copy, so sorting does not change the saved order.
  // Array sort is stable: books in the same group keep their order.
  visibleBooks.sort(function (a, b) {
    return (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
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
    item.dataset.status = book.status;

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
    const detailParts = [READER_NAMES[book.reader] || book.reader];
    detailParts.push(STATUS_LABELS[book.status] || book.status);
    if (OWNERSHIP_LABELS[book.ownership]) {
      detailParts.push(OWNERSHIP_LABELS[book.ownership]);
    }
    details.textContent = detailParts.join(" · ");
    item.appendChild(details);

    if (book.status === "finished") {
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

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", "Edit " + book.title);
    editButton.addEventListener("click", function () {
      openEditDialog(book);
    });
    item.appendChild(editButton);

    bookList.appendChild(item);
  });
}

const addForm = document.getElementById("add-form");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const readerSelect = document.getElementById("reader");
const ownershipSelect = document.getElementById("ownership");

// Fill in the reader names on the tabs, the form dropdown and the intro line.
// Falls back to the stored value if a name is missing.
tabButtons.forEach(function (button) {
  if (READER_NAMES[button.dataset.reader]) {
    button.textContent = READER_NAMES[button.dataset.reader];
  }
});
Array.from(readerSelect.options).forEach(function (option) {
  option.textContent = READER_NAMES[option.value] || option.value;
});
document.getElementById("intro").textContent =
  "Books for " + READER_NAMES.me + " and " + READER_NAMES.daughter;

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
    ownership: ownershipSelect.value,
    startDate: "",
    endDate: "",
    rating: 0,
    note: ""
  });

  saveBooks(books);
  render();

  addForm.reset();
  syncReaderSelect();
  titleInput.focus();
});

// Edit dialog. The dropdown options come from the same label objects as the list.
const editDialog = document.getElementById("edit-dialog");
const editForm = document.getElementById("edit-form");
const editTitle = document.getElementById("edit-title");
const editAuthor = document.getElementById("edit-author");
const editReader = document.getElementById("edit-reader");
const editOwnership = document.getElementById("edit-ownership");
const editStatus = document.getElementById("edit-status");
const editRatingRow = document.getElementById("edit-rating-row");
const editRatingStars = document.getElementById("edit-rating");

// Adds one <option> per entry in a labels object (text set with textContent).
// If emptyLabel is given, a first option with an empty value is added too.
function fillOptions(select, labels, emptyLabel) {
  if (emptyLabel !== undefined) {
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = emptyLabel;
    select.appendChild(empty);
  }
  Object.keys(labels).forEach(function (value) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = labels[value];
    select.appendChild(option);
  });
}

fillOptions(editReader, READER_NAMES);
fillOptions(editOwnership, OWNERSHIP_LABELS, "Not set");
fillOptions(editStatus, STATUS_LABELS);

// The book currently being edited (null when the dialog is closed).
let editingBook = null;

// The rating shown in the dialog. It is only copied to the book on Save.
let editRating = 0;

// Draws the five star buttons in the dialog for the current editRating.
function renderEditStars() {
  editRatingStars.replaceChildren();
  for (let star = 1; star <= 5; star++) {
    const starButton = document.createElement("button");
    starButton.type = "button";
    starButton.textContent = star <= editRating ? "★" : "☆";
    starButton.setAttribute("aria-label", "Rate " + star + (star === 1 ? " star" : " stars"));
    starButton.setAttribute("aria-pressed", editRating === star ? "true" : "false");
    starButton.addEventListener("click", function () {
      // Clicking the current rating again clears it.
      editRating = editRating === star ? 0 : star;
      renderEditStars();
      // The stars were redrawn, so put focus back on the one that was clicked.
      editRatingStars.children[star - 1].focus();
    });
    editRatingStars.appendChild(starButton);
  }
}

// Stars are only shown while the status in the dialog is Read.
function updateEditRatingRow() {
  editRatingRow.hidden = editStatus.value !== "finished";
}

editStatus.addEventListener("change", updateEditRatingRow);

function openEditDialog(book) {
  editingBook = book;
  editTitle.value = book.title;
  editAuthor.value = book.author;
  editReader.value = book.reader;
  editOwnership.value = book.ownership;
  editStatus.value = book.status;
  editRating = book.rating || 0;
  renderEditStars();
  updateEditRatingRow();
  editDialog.showModal();
  editTitle.focus();
}

editForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (!editingBook) return;

  const title = editTitle.value.trim();
  if (title === "") {
    editTitle.focus();
    return;
  }

  editingBook.title = title;
  editingBook.author = editAuthor.value.trim();
  editingBook.reader = editReader.value;
  editingBook.ownership = editOwnership.value;
  editingBook.status = editStatus.value;
  // Stars are only editable for Read books; other books keep their old rating.
  if (editStatus.value === "finished") editingBook.rating = editRating;

  saveBooks(books);
  editDialog.close();
  render();
});

// Remove asks for confirmation first. The dialog closes only if the book was removed.
document.getElementById("edit-remove").addEventListener("click", function () {
  if (!editingBook) return;
  if (removeBook(editingBook.id)) editDialog.close();
});

document.getElementById("edit-cancel").addEventListener("click", function () {
  editDialog.close();
});

// Closing the dialog any way (Save, Cancel or Esc) ends the edit.
editDialog.addEventListener("close", function () {
  editingBook = null;
});

render();
