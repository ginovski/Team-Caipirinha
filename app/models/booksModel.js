import 'parse'

var booksModel = (function(){
    var Book = Parse.Object.extend('Book');

    function add(name, author){
        var newBook = new Book();

        newBook.set('name', name);
        newBook.set('author', author);

        newBook.save();
    }

    return {
        add: add
    };
}());

export default booksModel;
