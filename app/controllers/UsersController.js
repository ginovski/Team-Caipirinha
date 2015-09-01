import htmlRenderer from 'app/views/helpers/htmlRenderer'
import partialsHelper from 'app/views/helpers/partialsHelper'

var UsersController = (function(){
    function login(){
        partialsHelper.getPartialViewTemplate('users/login')
            .then(function(template){
                partialsHelper.addPartialToPage(template);
            })
    }

    function register(){
        partialsHelper.getPartialViewTemplate('users/register')
            .then(function(template){
                partialsHelper.addPartialToPage(template);
            })
    }

    function postLogin(context){
        console.log(context.params);
    }

    function postRegister(context) {
        console.log(context.params);
    }

    return {
        login : login,
        register : register,
        postLogin: postLogin,
        postRegister: postRegister
    };
}());

export default UsersController;
