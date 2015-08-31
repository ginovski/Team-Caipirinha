import htmlRenderer from 'app/views/helpers/htmlRenderer'
import partialsHelper from 'app/views/helpers/partialsHelper'

var UsersController = (function(){
    function login(){
        partialsHelper
            .getPartialViewTemplate('users/login')
            .then(function(renderedHtml){
                partialsHelper.addPartialToPage(renderedHtml);
            });
    }

    return {
        login: login
    };
}());

export default UsersController;
