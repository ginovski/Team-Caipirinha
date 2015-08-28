import sammy from 'sammy'
import HomeController from 'app/controllers/HomeController'

var app = Sammy('#main', function() {
    this.get('#/', HomeController.index);
});

app.run('#/');