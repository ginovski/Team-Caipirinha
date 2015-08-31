import htmlRenderer from 'app/views/helpers/htmlRenderer'
import partialsHelper from 'app/views/helpers/partialsHelper'

import booksModel from 'app/models/booksModel'

var BooksController = (function(){
    function titles(){
        partialsHelper
            .getPartialViewTemplate('books/titles')
            .then(function(template){
                partialsHelper.addPartialToPage(template);
            });
    }

    return {
        titles: titles
    };
}());

export default BooksController;