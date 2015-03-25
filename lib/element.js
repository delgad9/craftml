var ee = require('event-emitter')

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