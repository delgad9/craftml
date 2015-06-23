var ee = require('event-emitter'),
    _ = require('lodash')

function Element(type, name, attribs){
    this.type = type
    this.name = name
    this.attribs = attribs

    // flags set during the render time for controlling certain dynamic behaviors
    // for example, whether this element should be renderred or not
    this.flags = {}

    // var e = ee()
    // this.on = e.on
    // this.emit = e.emit
    return this
}

module.exports = Element

Element.prototype.hasParameterByName = function(name) {

    return _.some(this.children, function(element) {

        var pattern = {
            type: 'tag',
            name: 'parameter',
            attribs: {
                name: name
            }
        }

        return _.isMatch(element, pattern)
    })

}

Element.prototype.hasContentByName = function(name){
    if (this.contents){
        return _.some(this.contents, function(c) {
            return c.attribs['name'] === name
        })
    } else {
        return false
    }
}

// recursively go down to collect all <content> tags
// this should probably happen during the parse time?
Element.prototype.getContentParameters = function(){

    var more = _.map(this.children, function(c){
        if (c.type === 'tag'){
            return c.getContentParameters()
        }
    }, this)

    if (this.name === 'content'){
        more.push(this)
    }
    return _.compact(_.flatten(more))
}

Element.prototype.getParametersByType = function(type) {

    return _.filter(this.children, function(element) {

        var pattern = {
            type: 'tag',
            name: 'parameter',
            attribs: {
                type: type
            }
        }

        return _.isMatch(element, pattern)
    })

}
