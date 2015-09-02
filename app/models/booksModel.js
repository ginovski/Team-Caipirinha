import Book from 'app/models/viewModels/bookViewModel';
import db from 'app/models/data/db';

var booksModel = (function () {
    function add(cover, title, author, publisher, year, pages, isbn, url) {
        var newBook = new Book(cover, title, author, publisher, year, pages, isbn, url);
        db.add('Book', newBook);
    }

    function getById(id) {
        return db.getById('Book', id);
    }

    function getAll() {
        return db.query('Book').find();
    }

    return {
        add: add,
        getById: getById,
        getAll: getAll
    };
}());

export default booksModel;