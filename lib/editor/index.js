var $ = require('jquery')
var React = require('react')
var _ = require('lodash')
var CraftApp = require('./components/craft-app.jsx')

if (typeof craft == 'undefined') {
    craft = {}
}

craft.edit = function(element, options) {
    var app = React.createElement(CraftApp, options)
    React.render(app, element)
    return app
}

$('#craftml').each(function() {
    var s = $(this).html()
        // unwrap comment to obtain the script conents
    var m = s.match(/<!--\s*([^]*)\s*-->/)
    var contents = m ? m[1] : ''

    // var useWorker = !($(this).attr('useWorker') == 'false')
    // var autoResize = !($(this).attr('autoResize') == 'false')

    var props = options
    props.contents = contents
    craft.edit(this, props)
})


// socket.on('connect', function() {});
// socket.on('event', function(data) {
//     console.log('event', data)
//     app.setContents('test')
// });
// socket.on('disconnect', function() {});