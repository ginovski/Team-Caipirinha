import Handlebars from 'handlebars'

var htmlRenderer = (function() {
    function renderArray(htmlTemplate, data) {
        var source = htmlTemplate;
        var template = Handlebars.compile(source);
        var htmlWrapper = '';
        data.forEach(function(book){
            var html = template(book);
            htmlWrapper += html;
        });

        return htmlWrapper;
    }

    function render(htmlTemplate, data) {
        var source = htmlTemplate;
        var template = Handlebars.compile(source);

        var html = template(data);

        return html;
    }

    return {
        renderArray: renderArray,
        render: render
    };
}());

export default htmlRenderer;