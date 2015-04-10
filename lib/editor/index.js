var $ = require('jquery')
var React = require('react')
var _ = require('lodash')
var CraftApp = require('./components/craft-app.jsx')

if (typeof craft == 'undefined') {
    craft = {}
}




craft.edit = function(element, options) {
    var unescaped_contents = _.unescape(options.contents)
    var app = React.createElement(CraftApp, {
        contents: unescaped_contents,
        useWorker: options.useWorker,
        autoResize: options.autoResize,
        file: options.file
    })
    React.render(app, element)
    return app
}

$('.craftml').each(function() {
    // var contents = $(this).find('.source')[0].innerHTML
    var s = $(this).html()
        // unwrap comment to obtain the script conents
    var m = s.match(/<!--\s*([^]*)\s*-->/)
    var contents = m ? m[1] : ''

    var useWorker = !($(this).attr('useWorker') == 'false')
    var autoResize = !($(this).attr('autoResize') == 'false')

    
    var app = craft.edit(this, {
        contents: contents,
        useWorker: useWorker,
        autoResize: true,
        file: socket
    })

    
})


// socket.on('connect', function() {});
// socket.on('event', function(data) {
//     console.log('event', data)
//     app.setContents('test')
// });
// socket.on('disconnect', function() {});