import Book from 'app/models/viewModels/bookViewModel'
import db from 'app/models/data/db'

var booksModel = (function () {
    function add(title, author, url) {
        var newBook = new Book(title, author, url);
        db.add('Book', newBook);
    }

    function getById(id) {
        return db.getById('Book', id);
    }

    return {
        add: add,
        getById: getById
    }
}());

export default booksModel;