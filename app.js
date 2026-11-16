// Reading List app logic.

const STORAGE_KEY = "readinglist.books";

// Display names only. The stored values stay "me" and "daughter".
const READER_NAMES = { me: "Miona", daughter: "Sena" };

const BACKUP_KEY = "readinglist.books.backup";

// Fields added after the first version, with the value old books get.
const NEW_BOOK_FIELDS = { ownership: "", startDate: "", endDate: "", language: "" };

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

// Yearly reading goals, saved under their own key: { me: { "2026": 30 }, daughter: { ... } }.
// Keys are years. Old years stay stored, but only the current year is shown.
const GOALS_KEY = "readinglist.goals";

// Read the saved goals. Falls back to no goals if nothing is saved, the saved
// data is not valid JSON, or localStorage is unavailable.
function loadGoals() {
  try {
    const saved = localStorage.getItem(GOALS_KEY);
    if (saved === null) return {};
    const parsed = JSON.parse(saved);
    const isObject = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);
    return isObject ? parsed : {};
  } catch (error) {
    return {};
  }
}

// Save the goals. Returns false if saving failed.
function saveGoals(goalData) {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goalData));
    return true;
  } catch (error) {
    return false;
  }
}

// The single in-memory list of books, and the goals.
let books = loadBooks();
let goals = loadGoals();

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

// Today's date as "YYYY-MM-DD" in the local time zone (toISOString would use UTC).
function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

// Number of days from start to end, counting both days ("2026-11-01" to
// "2026-11-01" is 1 day). Returns 0 if either date is missing or end is before start.
function daysInclusive(start, end) {
  if (!start || !end || end < start) return 0;
  function toUtcDay(text) {
    const parts = text.split("-");
    return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) / 86400000;
  }
  return Math.round(toUtcDay(end) - toUtcDay(start)) + 1;
}

// Display labels for the language values. Old books have "" and show nothing.
const LANGUAGE_LABELS = {
  "de": "Deutsch",
  "en": "English",
  "sr": "Srpski"
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

// Draws the yearly challenge: one block per reader (always both readers).
function renderChallenge() {
  const year = String(new Date().getFullYear());
  const container = document.getElementById("challenge-rows");
  container.replaceChildren();

  Object.keys(READER_NAMES).forEach(function (reader) {
    const name = READER_NAMES[reader];
    const goal = goals[reader] && goals[reader][year];
    const hasGoal = Number.isInteger(goal) && goal > 0;

    // Read books for this reader that ended in the current year.
    const count = books.filter(function (book) {
      return book.reader === reader && book.status === "finished" &&
        typeof book.endDate === "string" && book.endDate.startsWith(year);
    }).length;

    const block = document.createElement("div");
    block.className = "challenge-row";

    const line = document.createElement("div");
    line.textContent = hasGoal
      ? name + ": " + count + " of " + goal + (goal === 1 ? " book" : " books") + " this year"
      : name + ": No goal set for this year";
    block.appendChild(line);

    if (hasGoal) {
      const bar = document.createElement("progress");
      bar.max = goal;
      bar.value = Math.min(count, goal);
      bar.setAttribute("aria-label", name + " yearly progress");
      block.appendChild(bar);
    }

    const form = document.createElement("form");
    form.className = "goal-form";

    const label = document.createElement("label");
    label.htmlFor = "goal-" + reader;
    label.textContent = "Goal for " + name;
    form.appendChild(label);

    const input = document.createElement("input");
    input.type = "number";
    input.id = "goal-" + reader;
    input.min = "1";
    input.max = "999";
    input.step = "1";
    input.value = hasGoal ? String(goal) : "";
    form.appendChild(input);

    const save = document.createElement("button");
    save.type = "submit";
    save.textContent = "Save";
    save.setAttribute("aria-label", "Save goal for " + name);
    form.appendChild(save);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const text = input.value.trim();
      if (text === "") {
        // An empty box removes the goal for this year.
        if (goals[reader]) delete goals[reader][year];
      } else {
        const number = Number(text);
        if (!Number.isInteger(number) || number < 1 || number > 999) {
          input.setCustomValidity("Enter a whole number from 1 to 999.");
          input.reportValidity();
          input.addEventListener("input", function () {
            input.setCustomValidity("");
          }, { once: true });
          return;
        }
        if (!goals[reader] || typeof goals[reader] !== "object") goals[reader] = {};
        goals[reader][year] = number;
      }
      saveGoals(goals);
      renderChallenge();
      // The challenge was redrawn, so put focus back on this reader's goal box.
      document.getElementById("goal-" + reader).focus();
    });

    block.appendChild(form);
    container.appendChild(block);
  });
}

// Draws the book list on the page. Typed text is always set with textContent.
function render() {
  updateTabs();
  renderChallenge();
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

    // Left side: line 1 (title and author) and line 2 (details).
    const text = document.createElement("div");
    text.className = "book-text";

    const heading = document.createElement("div");
    heading.className = "book-title";
    const title = document.createElement("strong");
    title.textContent = book.title;
    heading.appendChild(title);
    if (book.author) {
      const author = document.createElement("span");
      author.textContent = " by " + book.author;
      heading.appendChild(author);
    }
    text.appendChild(heading);

    const details = document.createElement("div");
    details.className = "details";

    // Adds a " · " separator before every part except the first.
    function addDetail(node) {
      if (details.childNodes.length > 0) {
        details.appendChild(document.createTextNode(" · "));
      }
      details.appendChild(node);
    }

    const readerPart = document.createElement("span");
    readerPart.textContent = READER_NAMES[book.reader] || book.reader;
    addDetail(readerPart);

    // Status is text with a small colour marker (the colour is only a hint).
    const statusPart = document.createElement("span");
    const marker = document.createElement("span");
    marker.className = "status-marker";
    marker.setAttribute("aria-hidden", "true");
    statusPart.appendChild(marker);
    statusPart.appendChild(document.createTextNode(STATUS_LABELS[book.status] || book.status));
    addDetail(statusPart);

    if (OWNERSHIP_LABELS[book.ownership]) {
      const ownershipPart = document.createElement("span");
      ownershipPart.textContent = OWNERSHIP_LABELS[book.ownership];
      addDetail(ownershipPart);
    }

    if (LANGUAGE_LABELS[book.language]) {
      const languagePart = document.createElement("span");
      languagePart.textContent = LANGUAGE_LABELS[book.language];
      addDetail(languagePart);
    }

    // Stars are shown for Read books that have a rating. Screen readers get
    // "4 of 5 stars" instead of the star characters.
    if (book.status === "finished" && book.rating > 0) {
      const ratingPart = document.createElement("span");
      const stars = document.createElement("span");
      stars.className = "stars";
      stars.setAttribute("aria-hidden", "true");
      stars.textContent = "★".repeat(book.rating) + "☆".repeat(5 - book.rating);
      const starsText = document.createElement("span");
      starsText.className = "visually-hidden";
      starsText.textContent = book.rating + " of 5 stars";
      ratingPart.appendChild(stars);
      ratingPart.appendChild(starsText);
      addDetail(ratingPart);
    }

    // Dates, and for Read books with both dates, how long it took.
    if (book.startDate) {
      const startedPart = document.createElement("span");
      startedPart.textContent = "Started " + book.startDate;
      addDetail(startedPart);
    }
    if (book.status === "finished" && book.endDate) {
      const finishedPart = document.createElement("span");
      finishedPart.textContent = "Finished " + book.endDate;
      addDetail(finishedPart);
      const days = daysInclusive(book.startDate, book.endDate);
      if (days > 0) {
        const durationPart = document.createElement("span");
        durationPart.textContent = "Read in " + days + (days === 1 ? " day" : " days");
        addDetail(durationPart);
      }
    }

    text.appendChild(details);
    item.appendChild(text);

    // Buttons on the right: a note icon (only if the book has a note), then Edit.
    const actions = document.createElement("div");
    actions.className = "book-actions";

    if (book.note) {
      const noteButton = document.createElement("button");
      noteButton.type = "button";
      noteButton.className = "note-button";
      noteButton.textContent = "\u{1F4DD}";
      noteButton.setAttribute("aria-label", "Show note for " + book.title);
      noteButton.addEventListener("click", function () {
        openNoteDialog(book.note, false, null);
      });
      actions.appendChild(noteButton);
    }

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", "Edit " + book.title);
    editButton.addEventListener("click", function () {
      openEditDialog(book);
    });
    actions.appendChild(editButton);
    item.appendChild(actions);

    bookList.appendChild(item);
  });
}

const addForm = document.getElementById("add-form");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const readerSelect = document.getElementById("reader");
const ownershipSelect = document.getElementById("ownership");
const languageSelect = document.getElementById("language");

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
    language: languageSelect.value,
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

// Note dialog. It shows a note as plain text, or (when editable) a textarea.
const noteDialog = document.getElementById("note-dialog");
const noteForm = document.getElementById("note-form");
const noteText = document.getElementById("note-text");
const noteInputRow = document.getElementById("note-input-row");
const noteInput = document.getElementById("note-input");
const noteCancel = document.getElementById("note-cancel");
const noteSave = document.getElementById("note-save");

// Called with the trimmed text when Save is pressed (null when just viewing).
let noteSaveHandler = null;

function openNoteDialog(text, editable, onSave) {
  noteText.hidden = editable;
  noteText.textContent = editable ? "" : text;
  noteInputRow.hidden = !editable;
  noteInput.value = editable ? text : "";
  noteSave.hidden = !editable;
  noteCancel.textContent = editable ? "Cancel" : "Close";
  noteSaveHandler = editable ? onSave : null;
  noteDialog.showModal();
  (editable ? noteInput : noteCancel).focus();
}

noteForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (noteSaveHandler) noteSaveHandler(noteInput.value.trim());
  noteDialog.close();
});

noteCancel.addEventListener("click", function () {
  noteDialog.close();
});

noteDialog.addEventListener("close", function () {
  noteSaveHandler = null;
});

// Edit dialog. The dropdown options come from the same label objects as the list.
const editDialog = document.getElementById("edit-dialog");
const editForm = document.getElementById("edit-form");
const editTitle = document.getElementById("edit-title");
const editAuthor = document.getElementById("edit-author");
const editReader = document.getElementById("edit-reader");
const editOwnership = document.getElementById("edit-ownership");
const editLanguage = document.getElementById("edit-language");
const editStatus = document.getElementById("edit-status");
const editStartRow = document.getElementById("edit-start-row");
const editStart = document.getElementById("edit-start");
const editEndRow = document.getElementById("edit-end-row");
const editEnd = document.getElementById("edit-end");
const editNoteButton = document.getElementById("edit-note");
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
fillOptions(editLanguage, LANGUAGE_LABELS, "Not set");
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

// The note being edited in the dialog. It is only copied to the book on Save.
let editNote = "";

function updateEditNoteButton() {
  editNoteButton.textContent = editNote ? "Edit note" : "Add note";
}

editNoteButton.addEventListener("click", function () {
  openNoteDialog(editNote, true, function (text) {
    editNote = text;
    updateEditNoteButton();
  });
});

// Start date is hidden for Want to read; End date is only shown for Read.
// The End date picker cannot go before the Start date.
function updateEditDateRows() {
  editStartRow.hidden = editStatus.value === "to-read";
  editEndRow.hidden = editStatus.value !== "finished";
  editEnd.min = editStart.value;
  editEnd.setCustomValidity("");
}

// Fills or clears the dates when the status changes in the dialog.
// The user can still change the dates afterwards.
editStatus.addEventListener("change", function () {
  const status = editStatus.value;
  if (status === "to-read") {
    editStart.value = "";
    editEnd.value = "";
  } else if (status === "reading") {
    if (editStart.value === "") editStart.value = todayString();
    editEnd.value = "";
  } else if (status === "finished") {
    if (editEnd.value === "") editEnd.value = todayString();
  }
  updateEditRatingRow();
  updateEditDateRows();
});

editStart.addEventListener("input", updateEditDateRows);
editEnd.addEventListener("input", function () {
  editEnd.setCustomValidity("");
});

function openEditDialog(book) {
  editingBook = book;
  editTitle.value = book.title;
  editAuthor.value = book.author;
  editReader.value = book.reader;
  editOwnership.value = book.ownership;
  editLanguage.value = book.language || "";
  editStatus.value = book.status;
  editStart.value = book.startDate || "";
  editEnd.value = book.endDate || "";
  editNote = book.note || "";
  updateEditNoteButton();
  editRating = book.rating || 0;
  renderEditStars();
  updateEditRatingRow();
  updateEditDateRows();
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

  // Apply the date rules to the values being saved.
  const status = editStatus.value;
  const startDate = status === "to-read" ? "" : editStart.value;
  const endDate = status === "finished" ? editEnd.value : "";

  if (startDate && endDate && endDate < startDate) {
    editEnd.setCustomValidity("The end date cannot be before the start date.");
    editEnd.reportValidity();
    return;
  }

  editingBook.title = title;
  editingBook.startDate = startDate;
  editingBook.endDate = endDate;
  editingBook.note = editNote;
  editingBook.author = editAuthor.value.trim();
  editingBook.reader = editReader.value;
  editingBook.ownership = editOwnership.value;
  editingBook.language = editLanguage.value;
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
