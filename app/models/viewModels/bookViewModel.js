class Book {
    constructor(title, author, bookUrl) {
        this.title = title;
        this.author = author;
        this.bookUrl = bookUrl;
        this.rating = 0;

        return this;
    }

    get getTitle() {
        return this.title;
    }

    set setTitle(value) {
        //Validate
        this.title = value;

        return this;
    }

    get getAuthor() {
        return this.author;
    }

    set setAuthor(value) {
        //Validate
        this.author = value;

        return this;
    }

    get getBookUrl() {
        return this.bookUrl;
    }

    set setBookUrl(value) {
        //Validate
        this.bookUrl = value;

        return this;
    }
}

export default Book;
