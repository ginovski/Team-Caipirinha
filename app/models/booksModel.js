import 'parse'

var booksModel = (function(){
    var Book = Parse.Object.extend('Book');

    function add(title, author, url){
        var newBook = new Book();

        newBook.set('title', title);
        newBook.set('author', author);
        newBook.set('bookUrl', url);
        newBook.set('rating', 0);

        newBook.save();
    }

    return {
        add: add
    };
}());

export default booksModel;
