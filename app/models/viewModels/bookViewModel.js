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
        if (value.length < 2 || 60 < value.length) {
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
        if (value.length < 2 || 40 < value.length) {
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
        if (value.length < 2 || 35 < value.length) {
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
        if (typeof value !== number || value.length < 1 || 3000 < value.length) {
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
        if (typeof value !== number || value.length !== 13) {
            alert('ISBN should be 13 digits');
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
