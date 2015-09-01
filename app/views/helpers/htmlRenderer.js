import Handlebars from 'handlebars'

var htmlRenderer = (function() {
    function render(htmlTemplate, data) {
        var source = htmlTemplate;
        var template = Handlebars.compile(source);
        var htmlWrapper = '';
        data.forEach(function(book){
            var html = template(book);
            htmlWrapper += html;
        });

        return htmlWrapper;
    }

    return {
        render: render
    };
}());

export default htmlRenderer;