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

    set setAuthor(value) {
        if (!validator.isValidName(value) || !validator.isInRange(value, 2, 40)) {
            alert('Book author should be in range from 2 to 40 characters');
        } else {
            this.author = value;
            return this;
        }
    }


    get getBookUrl() {
        return this.bookUrl;
    }

    set setBookUrl(value) {
        // TODO: Validation
        this.bookUrl = value;
        return this;
    }
}

export default Book;
