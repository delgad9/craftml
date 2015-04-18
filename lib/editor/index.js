var $ = require('jquery'),
    _ = require('lodash'),
    React = require('react'),
    CraftApp = require('./components/craft-app.jsx'),
    craftml = require('./craftml-worker')

var defaultOptions = {
    craftml: craftml
}

craftmlEditor = {}

craftmlEditor.editLocally = function(selector, options) {
    var element = $(selector)[0]
    var props = _.merge(defaultOptions, options)
    socket.on('preview', function(data) {
        console.log('index:preview', data)
        props.initialContents = data.contents
        props.previewable = data.previewable
        var app = React.createElement(CraftApp, props)
        React.render(app, element)
    })
    socket.emit('ready')
}

craftmlEditor.edit = function(selector, options) {
    var element = $(selector)[0]

    var s = $(selector).html()
    console.log(selector, s)

    // unwrap comment to obtain the script conents
    var m = s.match(/<!--\s*([^]*)\s*-->/)
    var contents = m ? m[1] : ''

    options.initialContents = contents
    var app = React.createElement(CraftApp, options)
    React.render(app, element)
}

global.craftmlEditor = craftmlEditor
