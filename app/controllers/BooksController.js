import htmlRenderer from 'app/views/helpers/htmlRenderer';
import partialsHelper from 'app/views/helpers/partialsHelper';

import booksModel from 'app/models/booksModel';

var BooksController = (function () {
    function titles() {
        booksModel.getAll()
            .then(function (books) {
                var data = books;
                partialsHelper
                    .getPartialViewTemplate('books/titles')
                    .then(function (template) {
                        var htmlParsed = htmlRenderer.renderArray(template, data);
                        partialsHelper.addPartialToPage(htmlParsed);
                    });
            });
    }

    function details(context) {
        booksModel.getById(context.params['id'])
            .then(function (book) {
                partialsHelper
                    .getPartialViewTemplate('books/details')
                    .then(function (template) {
                        var htmlParsed = htmlRenderer.render(template, book.attributes);
                        partialsHelper.addPartialToPage(htmlParsed);
                    });
            });
    }

    return {
        titles: titles,
        details: details
    };
}());

export default BooksController;