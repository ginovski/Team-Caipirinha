import Book from 'app/models/viewModels/bookViewModel';
import db from 'app/models/data/db';

var booksModel = (function () {
    function add(title, author, url) {
        var newBook = new Book(title, author, url);
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