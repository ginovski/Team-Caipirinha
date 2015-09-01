import htmlRenderer from 'app/views/helpers/htmlRenderer'
import partialsHelper from 'app/views/helpers/partialsHelper'

import booksModel from 'app/models/booksModel'

var BooksController = (function(){
    function titles(){
        booksModel.getAll()
            .then(function(books) {
                var data = books;
                partialsHelper
                    .getPartialViewTemplate('books/titles')
                    .then(function (template) {
                        var htmlParsed = htmlRenderer.render(template,data);
                        partialsHelper.addPartialToPage(htmlParsed);
                    });
            });
    }

    function details(context){

    }

    return {
        titles: titles,
        details: details
    };
}());

export default BooksController;