var partialsHelper = (function(){
    function getPartialViewTemplate(partialName){
        var promise = new Promise(function(resolve, reject){
            $.get('app/views/partials/' + partialName + '.html')
                .then(function(partial){
                    resolve(partial);
                }, function(err){
                    reject(err);
                })
        })

        return promise;
    }

    function addPartialToPage(renderedPartialHtml){
        $('#main').html(renderedPartialHtml);
    }

    return{
        getPartialViewTemplate: getPartialViewTemplate,
        addPartialToPage: addPartialToPage
    };
}());

export default partialsHelper;