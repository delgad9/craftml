var ee = require('event-emitter'),
    _ = require('lodash')

function Element(type, name, attribs){
    this.type = type
    this.name = name
    this.attribs = attribs
    var e = ee()
    this.on = e.on
    this.emit = e.emit
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
