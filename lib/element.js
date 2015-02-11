var debug = require('debug')('craft.element')
var EventEmitter = require("events").EventEmitter

module.exports = Element

var _ = require('lodash')
    // Solid = require('./solid'),
    // CraftRef = require('./craftref'),
    // Craft = require('./craft'),
    // Place = require('./place'),
    // Parameter = require('./parameter'),
    // Scope = require('./scope'),
    // layout = require('./layout')

function Element() {
    this.children = []
    this.class = this.constructor.name
}

_.extend(Element.prototype, EventEmitter.prototype)

Element.prototype.constructor = Element

Element.prototype.doLayout = layout.row

Element.prototype.layout = function(children, parent) {

    if (this.attribs && this.attribs['position'] === 'absolute'){
        
        layout.absolute(children, parent)

    } else {

        this.doLayout(children, parent)
    }
}

Element.prototype.renderSelf = function(scope) {
    return new Solid()
}

Element.prototype.resolveChildren = function(scope) {
    return this.children
}

Element.prototype.merge = function(selfSolid, childrenSolids) {

    if (childrenSolids.length > 0) {
        this.layout(childrenSolids, selfSolid)
        selfSolid.children = childrenSolids
    }

    this.rendered = selfSolid
    return selfSolid
}

// Returns an array of solid
Element.prototype.render = function(scope) {
    this.emit('render', this, scope)

    scope = scope || new Scope()

    // render self

    var selfSolid = this.renderSelf(scope)

    // render children

    var children = this.resolveChildren(scope)

    updateScope(children, scope)

    var childrenSolids = renderChildren(children, scope)

    // merge self and children solids

    var solid = this.merge(selfSolid, childrenSolids)

    if (solid.layout && this.attribs){
        solid.layout.location.x = Number(this.attribs['x']) || 0
        solid.layout.location.y = Number(this.attribs['y']) || 0
        solid.layout.location.z = Number(this.attribs['z']) || 0
    }

    return solid
}

Element.prototype.getSize = function() {
    if (this.rendered) {
        return this.rendered.layout.size
    }
}



function updateScope(elements, scope) {

    elements.forEach(function(element) {

        // store a reference to each element in 'scope'
        scope.addElement(element)

        if (true){//element instanceof Craft) {

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
}

function renderChildren(children, scope) {

    var solids = _(children)
        .reject(function(element) {
            // do not render Craft and Parameter
            return element instanceof Craft || element instanceof Parameter
        })
        .map(function(element) {

            // assign attributes as scope parameters
            var childScope = scope.clone()
            _.extend(childScope.parameters, element.attribs)
            return element.render(childScope)

        })
        .compact() // ignore those not rendering anything (i.e., returns undefined)
        .flatten()
        .value()

    return solids
}