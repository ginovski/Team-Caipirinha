import htmlRenderer from 'app/views/helpers/htmlRenderer';
import partialsHelper from 'app/views/helpers/partialsHelper';

import userModel from 'app/models/data/user';

var UsersController = (function () {
    function login() {
        partialsHelper.getPartialViewTemplate('users/login')
            .then(function (template) {
                partialsHelper.addPartialToPage(template);
            });
    }

    function register() {
        partialsHelper.getPartialViewTemplate('users/register')
            .then(function (template) {
                partialsHelper.addPartialToPage(template);
            });
    }

    function logout(context){
        partialsHelper.getPartialViewTemplate('users/loggedOut')
            .then(function (template) {
                partialsHelper.addToPage(template);
            });
        userModel.signOut()
            .then(function(){
                context.redirect('#/');
            });
    }

    function postLogin(context) {
        var username = context.params['username'];
        var password = context.params['password'];
        partialsHelper.getPartialViewTemplate('users/loggedIn')
            .then(function (template) {
                partialsHelper.addToPage(template);
            });
        userModel.signIn(username, password)
            .then(function (user) {
                context.redirect('#/');
                if(user){
                    $('#username').html("Hello " + user.username);
                    $('.logout').show();
                    document.location.reload(true);
                } else {
                    $('.login').show();
                }
            });
    }

    function postRegister(context) {
        var email = context.params['email'];
        var username = context.params['username'];
        var password = context.params['password'];

        userModel.signUp(email, username, password)
            .then(function (user) {
                context.redirect('#/');
                if(user){
                    $('#username').html("Hello " + user.username);
                    $('.logout').show();
                    document.location.reload(true);
                } else {
                    $('.login').show();
                }
            });
    }

    return {
        login: login,
        register: register,
        logout: logout,
        postLogin: postLogin,
        postRegister: postRegister
    };
}());

export default UsersController;
