import htmlRenderer from 'app/views/helpers/htmlRenderer'
import partialsHelper from 'app/views/helpers/partialsHelper'

import booksModel from 'app/models/booksModel'

var HomeController = (function(){
    function index(){
        partialsHelper
            .getPartialViewTemplate('index')
            .then(function(template){
                var renderedHtml = htmlRenderer.render(template, {title: 'TestIndex', body: 'TestBody'});

                partialsHelper.addPartialToPage(renderedHtml);
            });
    }

    return {
        index: index
    };
}());

export default HomeController;
