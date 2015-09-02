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

    function postLogin(context) {
        var username = context.params['username'];
        var password = context.params['password'];

        userModel.signIn(username, password)
            .then(function (user) {
                context.redirect('#/titles');
            });
    }

    function postRegister(context) {
        var email = context.params['email'];
        var username = context.params['username'];
        var password = context.params['password'];

        userModel.signUp(email, username, password)
            .then(function (user) {
                context.redirect('#/');
            });
    }

    return {
        login: login,
        register: register,
        postLogin: postLogin,
        postRegister: postRegister
    };
}());

export default UsersController;
