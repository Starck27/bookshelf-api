const submitFormElement = document.getElementById("bookForm");
const searchBookForm = document.getElementById("searchBook");
const incompleteBookList = document.getElementById("incompleteBookList");
const completeBookList = document.getElementById("completeBookList");
const toast = document.getElementById("toast");

const bookItem = [];
const RENDER_EVENT = "render-bookitem";
const SAVED_EVENT = "saved-bookItem";
const STORAGE_KEY = "book";

let isEditing = false;
let bookBeingEditedId = null;

document.addEventListener("DOMContentLoaded", function () {
  submitFormElement.addEventListener("submit", function (event) {
    event.preventDefault();
    if (isEditing) {
      updateBook();
    } else {
      addBookToRead();
    }
  });

  if (isStorageExist()) {
    loadDataFromStorage();
  }
});

function addBookToRead() {
  const bookItemTitle = document.getElementById("bookFormTitle").value.trim();
  const bookItemAuthor = document.getElementById("bookFormAuthor").value.trim();
  const bookItemYear = Number(
    document.getElementById("bookFormYear").value.trim()
  );
  const bookItemIsComplete =
    document.getElementById("bookFormIsComplete").checked;

  const generateID = generateId();
  const bookItemObject = generateBookItemObject(
    generateID,
    bookItemTitle,
    bookItemAuthor,
    bookItemYear,
    bookItemIsComplete
  );

  bookItem.push(bookItemObject);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
  resetForm();
  showToast("Data Berhasil disimpan!");
}

function generateId() {
  return +new Date();
}

function generateBookItemObject(id, title, author, year, isComplete) {
  return {
    id,
    title,
    author,
    year,
    isComplete,
  };
}

document.addEventListener(RENDER_EVENT, function () {
  console.log(bookItem);
  incompleteBookList.innerHTML = "";
  completeBookList.innerHTML = "";

  for (const book of bookItem) {
    const bookElement = makeBookItem(book);

    if (book.isComplete) {
      completeBookList.append(bookElement);
    } else {
      incompleteBookList.append(bookElement);
    }
  }
});

function makeBookItem(bookItemObject) {
  const bookTitle = document.createElement("h3");
  bookTitle.setAttribute("data-testid", "bookItemTitle");
  bookTitle.innerText = bookItemObject.title;

  const bookAuthor = document.createElement("p");
  bookAuthor.setAttribute("data-testid", "bookItemAuthor");
  bookAuthor.innerText = `Penulis: ${bookItemObject.author}`;

  const bookYear = document.createElement("p");
  bookYear.setAttribute("data-testid", "bookItemYear");
  bookYear.innerText = `Tahun: ${bookItemObject.year}`;

  const isCompleteButton = document.createElement("button");
  isCompleteButton.setAttribute("data-testid", "bookItemIsCompleteButton");
  isCompleteButton.classList.add("bookItem-button");
  isCompleteButton.innerText = bookItemObject.isComplete
    ? "Belum Selesai Dibaca"
    : "Selesai Dibaca";

  const deleteButton = document.createElement("button");
  deleteButton.setAttribute("data-testid", "bookItemDeleteButton");
  deleteButton.classList.add("bookItem-button");
  deleteButton.innerText = "Hapus Buku";

  const editButton = document.createElement("button");
  editButton.setAttribute("data-testid", "bookItemEditButton");
  editButton.classList.add("bookItem-button");
  editButton.innerText = "Edit Buku";

  const buttonContainer = document.createElement("div");
  buttonContainer.append(isCompleteButton, deleteButton, editButton);

  const container = document.createElement("div");
  container.setAttribute("data-bookid", `${bookItemObject.id}`);
  container.setAttribute("data-testid", "bookItem");
  container.append(bookTitle, bookAuthor, bookYear, buttonContainer);

  isCompleteButton.addEventListener("click", function () {
    bookItemObject.isComplete
      ? undoBookFromCompleted(bookItemObject.id)
      : addBookToCompleted(bookItemObject.id);
  });

  deleteButton.addEventListener("click", function () {
    removeBookFromList(bookItemObject.id);
  });

  editButton.addEventListener("click", function () {
    enterEditMode(bookItemObject);
  });

  return container;
}

function enterEditMode(bookItemObject) {
  document.getElementById("bookFormTitle").value = bookItemObject.title;
  document.getElementById("bookFormAuthor").value = bookItemObject.author;
  document.getElementById("bookFormYear").value = bookItemObject.year;
  document.getElementById("bookFormIsComplete").checked =
    bookItemObject.isComplete;

  isEditing = true;
  bookBeingEditedId = bookItemObject.id;
}

function updateBook() {
  const bookItemTitle = document.getElementById("bookFormTitle").value.trim();
  const bookItemAuthor = document.getElementById("bookFormAuthor").value.trim();
  const bookItemYear = Number(
    document.getElementById("bookFormYear").value.trim()
  );
  const bookItemIsComplete =
    document.getElementById("bookFormIsComplete").checked;

  if (bookItemTitle === "" || bookItemAuthor === "" || bookItemYear === "") {
    showToast("Mohon lengkapi semua data!");
    return;
  }

  const bookIndex = findBookItemIndex(bookBeingEditedId);
  if (bookIndex !== -1) {
    bookItem[bookIndex].title = bookItemTitle;
    bookItem[bookIndex].author = bookItemAuthor;
    bookItem[bookIndex].year = bookItemYear;
    bookItem[bookIndex].isComplete = bookItemIsComplete;

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
    showToast("Buku berhasil diperbarui!");
  }

  resetForm();
}

function resetForm() {
  submitFormElement.reset();
  isEditing = false;
  bookBeingEditedId = null;
}

function addBookToCompleted(bookItemId) {
  const bookItemTarget = findBookItem(bookItemId);

  if (bookItemTarget == null) return;

  bookItemTarget.isComplete = true;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();

  showToast("Data Berhasil diperbarui!");
}

function findBookItem(bookItemId) {
  for (const book of bookItem) {
    if (book.id === bookItemId) {
      return book;
    }
  }

  return null;
}

function removeBookFromList(bookItemId) {
  const bookItemTarget = findBookItemIndex(bookItemId);

  if (bookItemTarget === -1) return;

  bookItem.splice(bookItemTarget, 1);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();

  showToast("Data berhasil dihapus!");
}

function undoBookFromCompleted(bookItemId) {
  const bookItemTarget = findBookItem(bookItemId);

  if (bookItemTarget === null) false;

  bookItemTarget.isComplete = false;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();

  showToast("Data Berhasil diperbarui!");
}

function findBookItemIndex(bookItemId) {
  for (const index in bookItem) {
    if (bookItem[index].id === bookItemId) {
      return parseInt(index);
    }
  }

  return -1;
}

function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(bookItem);
    localStorage.setItem(STORAGE_KEY, parsed);
    document.dispatchEvent(new Event(SAVED_EVENT));
  }
}

function isStorageExist() {
  if (typeof Storage === undefined) {
    alert("Browser kamu tidak mendukung local storage");
    return false;
  }
  return true;
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  let data = JSON.parse(serializedData);

  if (data !== null) {
    for (const book of data) {
      bookItem.push(book);
    }
  }

  document.dispatchEvent(new Event(RENDER_EVENT));
}

searchBookForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const searchValue = document.getElementById("searchBookTitle").value;

  const filteredBooks = bookItem.filter((book) =>
    book.title.includes(searchValue)
  );

  displayBooks(filteredBooks);
});

function displayBooks(filteredBooks) {
  incompleteBookList.innerHTML = "";
  completeBookList.innerHTML = "";

  if (filteredBooks.length === 0) {
    showToast("Buku tidak ditemukan!");
  } else {
    for (const book of filteredBooks) {
      const bookElement = makeBookItem(book);
      if (book.isComplete) {
        completeBookList.append(bookElement);
      } else {
        incompleteBookList.append(bookElement);
      }
    }
  }
}

function showToast(message) {
  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(function () {
    toast.classList.remove("show");
  }, 2000);
}
