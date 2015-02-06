var debug = require('debug')('craft.element')
var EventEmitter = require("events").EventEmitter

module.exports = Element

var _ = require('lodash'),
    Solid = require('./solid'),
    CraftRef = require('./craftref'),
    Craft = require('./craft'),
    Place = require('./place'),
    Parameter = require('./parameter'),
    Scope = require('./scope')

function Element() {
    this.children = []
    this.class = this.constructor.name
}

_.extend(Element.prototype, EventEmitter.prototype)

Element.prototype.constructor = Element

Element.prototype.doLayout = rowLayout

Element.prototype.renderChildren = function(children, scope) {
    
    children.forEach(function(element) {
        scope.addElement(element)
    })

    // compute scope
    children.forEach(function(element) {
        if (element instanceof Craft) {

            // resolve nested craft
            scope[element.name] = element

        } else if (element instanceof Parameter) {

            // resolve parameters

            // get val
            var val
            if (!(element.name in scope.parameters)) {
                // not set by the caller
                // use the default value

                val = element.attribs['default']
            } else {

                val = scope.parameters[element.name]
            }

            var type = element.attribs['type']
            if (type === 'int') {
                val = Number(val)
            } else if (type === 'string') {

                val = '' + val
            }

            if (val === undefined) {
                val = ''
            }

            scope.parameters[element.name] = val

        }
    })

    var solids = _(children)
        .map(function(element) {

            // assign attributes as scope parameters
            var childScope = scope.clone()
            _.extend(childScope.parameters, element.attribs)

            if (element instanceof Craft) {
                // do not render Craft

            } else if (element instanceof Parameter) {
                // do not render Parameter
            } else {

                return element.render(childScope)
            }
        })
        .compact()
        .flatten()
        .value()

    return solids
}

Element.prototype.render = function(scope) {
    this.emit('render', this, scope)

    scope = scope || new Scope()
    
    var children = this.children
    var solids = this.renderChildren(children, scope)

    // layout these solids
    this.doLayout(solids)

    // create a parent Solid to group these solids under
    var solid = new Solid()
    solid.children = solids
    solid.fitToChildren()

    this.rendered = solid
    return solid
}

Element.prototype.getSize = function() {
    if (this.rendered) {
        return this.rendered.layout.size
    }
}

function rowLayout(solids) {
    var tx = 0
    solids.forEach(function(solid) {
        solid.layout.x = tx
        tx = tx + solid.layout.width
    })
}

function stackLayout(solids) {
    var tz = 0
    solids.forEach(function(solid) {
        solid.layout.z = tz
        tz = tz + solid.layout.depth
    })
}