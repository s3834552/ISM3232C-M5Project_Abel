// =============================
// Domain Model
// =============================

enum Genre {
    Fiction = "Fiction",
    NonFiction = "Non-Fiction",
    Fantasy = "Fantasy",
    Science = "Science",
    Biography = "Biography"
}

class Book {
    constructor(
        public identifier: string,
        public name: string,
        public description: string,
        public pictureLocation: string,
        public genre: Genre,
        public author: string,
        public numberOfPages: number
    ) {}
}

interface MediaCollection<T> {
    identifier: string;
    name: string;
    collection: T[];
    sortField?: string;
    sortDirection?: "asc" | "desc";
}

// =============================
// Controller
// =============================

class MediaManController {

    private collections: MediaCollection<Book>[] = [];
    private container: HTMLDivElement;
    private storageKey = "mediaman-data";

    constructor() {
        this.container =
            document.getElementById("bookCollections") as HTMLDivElement;

        this.loadFromStorage();
        this.render();
    }

    // =============================
    // STORAGE
    // =============================

    private saveToStorage(): void {
        localStorage.setItem(this.storageKey, JSON.stringify(this.collections));
    }

    private loadFromStorage(): void {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return;

        const parsed = JSON.parse(raw);

        this.collections = parsed.map((c: any) => ({
            ...c,
            collection: c.collection.map((b: any) =>
                new Book(
                    b.identifier,
                    b.name,
                    b.description,
                    b.pictureLocation,
                    b.genre,
                    b.author,
                    b.numberOfPages
                )
            )
        }));
    }

    // =============================
    // COLLECTIONS
    // =============================

    createBookCollection(): void {

        const input =
            document.getElementById("newBookCollectionName") as HTMLInputElement;

        if (!input.value.trim()) {
            alert("Collection name required");
            return;
        }

        this.collections.push({
            identifier: crypto.randomUUID(),
            name: input.value,
            collection: [],
            sortField: "name",
            sortDirection: "asc"
        });

        input.value = "";
        this.saveToStorage();
        this.render();
    }

    removeBookCollection(identifier: string): void {
        this.collections =
            this.collections.filter(c => c.identifier !== identifier);

        this.saveToStorage();
        this.render();
    }

    // =============================
    // BOOKS
    // =============================

    createBook(collectionIdentifier: string): void {

        const collection =
            this.collections.find(c => c.identifier === collectionIdentifier);

        if (!collection) return;

        const name = (document.getElementById(
            `bookName-${collectionIdentifier}`) as HTMLInputElement).value;

        const author = (document.getElementById(
            `bookAuthor-${collectionIdentifier}`) as HTMLInputElement).value;

        const pages = parseInt((document.getElementById(
            `bookPages-${collectionIdentifier}`) as HTMLInputElement).value);

        const genreKey = (document.getElementById(
            `bookGenre-${collectionIdentifier}`) as HTMLSelectElement).value as keyof typeof Genre;

        if (!name || !author || !pages) {
            alert("All fields required");
            return;
        }

        collection.collection.push(
            new Book(
                crypto.randomUUID(),
                name,
                "",
                "",
                Genre[genreKey],
                author,
                pages
            )
        );

        this.sortCollection(collection);
        this.saveToStorage();
        this.render();
    }

    removeBook(collectionIdentifier: string, bookIdentifier: string): void {

        const collection =
            this.collections.find(c => c.identifier === collectionIdentifier);

        if (!collection) return;

        collection.collection =
            collection.collection.filter(b => b.identifier !== bookIdentifier);

        this.saveToStorage();
        this.render();
    }

    // =============================
    // EDITING
    // =============================

    editBook(collectionId: string, bookId: string): void {
        const row = document.getElementById(`book-${bookId}`);
        if (!row) return;

        row.innerHTML = `
            <input id="edit-name-${bookId}" value="${this.getBook(collectionId, bookId)?.name}">
            <input id="edit-author-${bookId}" value="${this.getBook(collectionId, bookId)?.author}">
            <input id="edit-pages-${bookId}" type="number"
                   value="${this.getBook(collectionId, bookId)?.numberOfPages}">
            <button onclick="mediaManController.saveBookEdit('${collectionId}','${bookId}')">Save</button>
            <button onclick="mediaManController.render()">Cancel</button>
        `;
    }

    saveBookEdit(collectionId: string, bookId: string): void {

        const book = this.getBook(collectionId, bookId);
        if (!book) return;

        book.name = (document.getElementById(
            `edit-name-${bookId}`) as HTMLInputElement).value;

        book.author = (document.getElementById(
            `edit-author-${bookId}`) as HTMLInputElement).value;

        book.numberOfPages = parseInt((document.getElementById(
            `edit-pages-${bookId}`) as HTMLInputElement).value);

        this.saveToStorage();
        this.render();
    }

    private getBook(collectionId: string, bookId: string): Book | undefined {
        return this.collections
            .find(c => c.identifier === collectionId)
            ?.collection.find(b => b.identifier === bookId);
    }

    // =============================
    // SORTING
    // =============================

    sortBooks(collectionId: string, field: string): void {

        const collection =
            this.collections.find(c => c.identifier === collectionId);

        if (!collection) return;

        if (collection.sortField === field) {
            collection.sortDirection =
                collection.sortDirection === "asc" ? "desc" : "asc";
        } else {
            collection.sortField = field;
            collection.sortDirection = "asc";
        }

        this.sortCollection(collection);
        this.saveToStorage();
        this.render();
    }

    private sortCollection(collection: MediaCollection<Book>): void {

        const dir = collection.sortDirection === "asc" ? 1 : -1;

        collection.collection.sort((a: any, b: any) => {
            if (a[collection.sortField!] < b[collection.sortField!]) return -1 * dir;
            if (a[collection.sortField!] > b[collection.sortField!]) return 1 * dir;
            return 0;
        });
    }

    // =============================
    // RENDER
    // =============================

    private render(): void {

        this.container.innerHTML = "";

        this.collections.forEach(collection => {

            const div = document.createElement("div");
            div.style.border = "1px solid #ccc";
            div.style.padding = "10px";
            div.style.marginBottom = "20px";

            div.innerHTML = `
                <h3>${collection.name}</h3>
                <button onclick="mediaManController.removeBookCollection('${collection.identifier}')">
                    Remove Collection
                </button>

                <h4>Add Book</h4>
                <input id="bookName-${collection.identifier}" placeholder="Name">
                <input id="bookAuthor-${collection.identifier}" placeholder="Author">
                <input id="bookPages-${collection.identifier}" type="number" placeholder="Pages">
                <select id="bookGenre-${collection.identifier}">
                    ${Object.keys(Genre)
                        .map(g => `<option value="${g}">${Genre[g as keyof typeof Genre]}</option>`)
                        .join("")}
                </select>
                <button onclick="mediaManController.createBook('${collection.identifier}')">
                    Add Book
                </button>

                <h4>Sort By</h4>
                <button onclick="mediaManController.sortBooks('${collection.identifier}','name')">Name</button>
                <button onclick="mediaManController.sortBooks('${collection.identifier}','author')">Author</button>
                <button onclick="mediaManController.sortBooks('${collection.identifier}','numberOfPages')">Pages</button>
                <button onclick="mediaManController.sortBooks('${collection.identifier}','genre')">Genre</button>

                <ul>
                    ${collection.collection.map(book => `
                        <li id="book-${book.identifier}">
                            ${book.name} | ${book.author} | ${book.genre} | ${book.numberOfPages} pages
                            <button onclick="mediaManController.editBook('${collection.identifier}','${book.identifier}')">Edit</button>
                            <button onclick="mediaManController.removeBook('${collection.identifier}','${book.identifier}')">X</button>
                        </li>
                    `).join("")}
                </ul>
            `;

            this.container.appendChild(div);
        });
    }
}

const mediaManController = new MediaManController();
(window as any).mediaManController = mediaManController;