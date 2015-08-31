class Book {
    constructor(title, author, bookUrl) {
        this.title = title;
        this.author = author;
        this.bookUrl = bookUrl;
        this.rating = 0;

        return this;
    }

    get title() {
        return this._title;
    }

    set title(value) {
        //Validate
        this._title = value;

        return this;
    }

    get author() {
        return this._author;
    }

    set author(value) {
        //Validate
        this._author = value;

        return this;
    }

    get bookUrl() {
        return this._bookUrl;
    }

    set bookUrl(value) {
        //Validate
        this._bookUrl = value;

        return this;
    }
}

export default Book;
