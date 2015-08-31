import htmlRenderer from 'app/views/helpers/htmlRenderer'
import partialsHelper from 'app/views/helpers/partialsHelper'

var HomeController = (function(){
    function index(){
        partialsHelper
            .getPartialViewTemplate('index')
            .then(function(template){
                partialsHelper.addPartialToPage(template);
            });
    }

    return {
        index: index
    };
}());

export default HomeController;
