import sammy from 'sammy';

import BooksController from 'app/controllers/BooksController';
import HomeController from 'app/controllers/HomeController';
import UsersController from 'app/controllers/UsersController';

import user from 'app/models/data/user';

var app = new Sammy('#main', function () {
    this.get('#/', HomeController.index);
    this.get('#/login', UsersController.login);
    this.get('#/register', UsersController.register);
    this.get('#/loggedOut', UsersController.logout);
    this.post('#/login', UsersController.postLogin);
    this.post('#/register', UsersController.postRegister);
    this.get('#/titles', BooksController.titles);
    this.get('#/books/details/:id', BooksController.details);
});
(function(){
    app.run('#/');

    if(user.getCurrentUser()){
        $('#username').html("Hello " + user.getCurrentUser().attributes.username);
        $('.logout').show();
    } else {
        $('.login').show();
    }

    $('.logout').click(function(){
        user.signOut();
        document.location.reload(true);
    })
}());