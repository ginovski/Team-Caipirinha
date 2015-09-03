class Book {
    constructor(cover, title, author, publisher, year, pages, isbn, bookUrl) {
        this.cover = cover;
        this.title = title;
        this.author = author;
        this.publisher = publisher;
        this.year = year;
        this.pages = pages;
        this.isbn = isbn;
        this.bookUrl = bookUrl;
        this.rating = 0;

        return this;
    }

    get getCover() {
        return this.cover;
    }

    set setCover(value) {
        if (value.match(/\.(jpeg|jpg|gif|png)$/i) !== null) {
            alert('Book cover should be .JPEG, .JPG, .GIF or .PNG');
        } else {
            this.cover = value;
            return this;
        }
    }

    get getTitle() {
        return this.title;
    }

    set setTitle(value) {
        if (!validator.isValidName(value) || !validator.isInRange(value, 2, 60)) {
            alert('Book title should be in range from 2 to 60 characters');
        } else {
            this.title = value;
            return this;
        }
    }

    get getAuthor() {
        return this.author;
    }

    set setAuthor(value) {
        if (!validator.isValidName(value) || !validator.isInRange(value, 2, 40)) {
            alert('Book author should be in range from 2 to 40 characters');
        } else {
            this.author = value;
            return this;
        }
    }

    get getPublisher() {
        return this.publisher;
    }

    set setPublisher(value) {
        if (!validator.isInRange(value, 2, 35)) {
            alert('Book publisher should be in range from 2 to 35 characters');
        } else {
            this.publisher = value;
            return this;
        }
    }

    get getYear() {
        return this.year;
    }

    set setYear(value) {
        if (typeof value !== number || value < 1900 || new Date().getFullYear() < value) {
            alert('Publication year should be a number in range from 1900 to current year');
        } else {
            this.year = value;
            return this;
        }
    }

    get getPages() {
        return this.pages;
    }

    set setPages(value) {
        if (typeof value !== number || !validator.isInRange(value, 1, 3000)) {
            alert('Book pages should be a number in range from 1 to 3000');
        } else {
            this.pages = value;
            return this;
        }
    }

    get getIsbn() {
        return this.isbn;
    }

    set setIsbn(value) {
        if (!validator.isbnValidator(value)) {
            alert('Invalid ISBN number!');
        } else {
            this.isbn = value;
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
