import sammy from 'sammy'

var app = Sammy('#main', function() {
    this.get('#/', function(){
        $('#main').html("Main");
    });

    this.get('#/books', function(){
        $('#main').html("Books");
    });
});

app.run('#/');