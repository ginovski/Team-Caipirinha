import sammy from 'sammy'
import HomeController from 'app/controllers/HomeController'

Parse.initialize("nCIDYfpYa07RZp5CvRIF801YyRIKhkGKxcL1qPK8", "AmAQxlbo87rxRt57uYVmZCC9PjXm432SRZA8UJ9k");

var app = Sammy('#main', function() {
    this.get('#/', HomeController.index);
});

app.run('#/');