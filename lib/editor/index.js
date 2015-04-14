var $ = require('jquery')
var React = require('react')
var CraftApp = require('./components/craft-app.jsx')

if (typeof craft == 'undefined') {
    craft = {}
}

// craft.edit = function(element, options) {
//     // var app = React.createElement(CraftApp, options)
//     // React.render(app, element, function(){

//     // })
    
//     socket.on('rendered', function(data) {
//         console.log('index:rendered')
//                 // console.log('r', data)
//                 // console.log(data)
//                 // this.refs.editor.setState({contents:contents})

//         var app = React.createElement(CraftApp, options)
//         // console.log(app, options)
//         options.initialContents = data.contents
//         React.render(app, element)        

//         // this.setState({contents: data.contents})
//     // this.didRender(data.rendered)
//     })
//     // socket.emit('ready')
//     // return app
// }

craft.editLocally = function(selector, options){
    var element = $(selector)[0]
    socket.on('rendered', function(data) {
        console.log('index:rendered')
        options.initialContents = data.contents
        var app = React.createElement(CraftApp, options)    
        React.render(app, element)        
    })
    socket.emit('ready')
}

craft.edit = function(selector, options){
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

global.craft = craft
// $('.craftml').each(function() {
    
//     // get the content in the element
//     var s = $(this).html()
    
//     // unwrap comment to obtain the script conents
//     var m = s.match(/<!--\s*([^]*)\s*-->/)
//     var contents = m ? m[1] : ''

//     // var useWorker = !($(this).attr('useWorker') == 'false')
//     // var autoResize = !($(this).attr('autoResize') == 'false')

//     var props = options
//     props.initialContents = contents
//     // props.fitTo = 'contents'
//     // props.fitTo = 'container'
//     craft.edit(this, props)
//     // craft.edit(this, props)
// })

// $('.craftml').each(function() {
    
//     // get the content in the element
//     var s = $(this).html()
    
//     // unwrap comment to obtain the script conents
//     var m = s.match(/<!--\s*([^]*)\s*-->/)
//     var contents = m ? m[1] : ''

//     // var useWorker = !($(this).attr('useWorker') == 'false')
//     // var autoResize = !($(this).attr('autoResize') == 'false')

//     var props = options
//     props.initialContents = contents
//     // props.fitTo = 'contents'
//     // props.fitTo = 'container'
//     craft.edit(this, props)
//     // craft.edit(this, props)
// })


