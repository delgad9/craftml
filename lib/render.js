var _ = require('lodash'),
    Solid = require('./solid'),
    Group = require('./group'),
    Scope = require('./scope'),
    parse = require('./parse')

module.exports = render

function hasParameterByName(elements, name) {
    return _.some(elements, function(element) {

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


function resolveAttribueValue(scope, value){
    if (_.isString(value)) {

        // resolve {{ }}

        var res = value.match(/{{(.*)}}/)
        if (res) {
            var expr = res[1]
            return scope.parameters[expr]

        } else {

            return value
        }

    } else {

        return value
    }
}

function resolveAttributesToParameters(scope, attribs, craft) {

    var parameters = {}

    _.forIn(attribs, function(value, key) {

        var attrName = key

        // check if callee has the parameter by the attrib name
        if (craft === undefined || hasParameterByName(craft.children, attrName)) {

            var resolved = resolveAttribueValue(scope, value)

            parameters[attrName] = resolved
        }

    })

    return parameters

}

function computeSize(children) {
    var xrange = {}
    var yrange = {}
    var zrange = {}
    xrange.min = _.min(children.map(function(c) {
        return c.layout.location.x
    }))
    xrange.max = _.max(children.map(function(c) {
        return c.layout.location.x + c.layout.size.x
    }))
    yrange.min = _.min(children.map(function(c) {
        return c.layout.location.y
    }))
    yrange.max = _.max(children.map(function(c) {
        return c.layout.location.y + c.layout.size.y
    }))
    zrange.min = _.min(children.map(function(c) {
        return c.layout.location.z
    }))
    zrange.max = _.max(children.map(function(c) {
        return c.layout.location.z + c.layout.size.z
    }))

    return {
        x: xrange.max - xrange.min,
        y: yrange.max - yrange.min,
        z: zrange.max - zrange.min
    }
}

function render(arg, scope) {

    var scope = scope || new Scope()
    // if (scope.stack === undefined)
        // scope.stack = []
    
    if (_.isArray(arg)) {

        // arg is [element]

        // console.log(arg)

        var childrenScope = scope.clone()
        childrenScope.solids = []

        arg.forEach(function(element, i) {
            
            var solids = render(element, childrenScope)            
            if (_.isArray(solids)) {                
                childrenScope.solids = childrenScope.solids.concat(solids)                
            } else if (_.isObject(solids)){ 
                childrenScope.solids.push(solids)                
            }
            
        })
        
        // scope.solids = _.fla
        return _.flatten(childrenScope.solids)

    } else {

        // arg is element
        var element = arg

        scope.trace = scope.trace || []
        scope.trace.push(element.type + ":" + element.name)


        if (element.type === 'tag') {


            if (element.name === 'group') {

                var grp = new Group()
                grp.children = _.flatten(element.children.map(function(child) {
                    return render(child, scope)
                }))
                grp.fitToChildren()
                return grp

            } else if (element.name === 'scale') {

                var grp = new Group()
                grp.children = _.flatten(element.children.map(function(child) {
                    return render(child, scope)
                }))
                grp.fitToChildren()
                var s
                if (element.attribs.factor){
                    var f = Number(element.attribs.factor)
                    s = [f,f,f]
                }else {
                    var x = Number(element.attribs.x) || 1
                    var y = Number(element.attribs.y) || 1
                    var z = Number(element.attribs.z) || 1    
                    s = [x,y,z]
                }
                grp.scale(s)
                return grp

            } else if (element.name === 'craft') {

                // console.log(element)

                scope[element.attribs['name']] = element

                return undefined

            } else if (element.name === 'parameter') {

                var name = element.attribs['name']

                var val
                if (!(name in scope.parameters)) {
                    // not set by the caller
                    // use the default value

                    val = element.attribs['default']

                } else {

                    val = scope.parameters[name]
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

                scope.parameters[name] = val

                return undefined // does not render to anything

            } else if (element.name === 'content') {

                // scope.parent is important for getting nested <content> tags ot work
                var solids = render(scope.callee.children, scope.parent)
                return solids

            } else {

                // must refer to something previously defined

                // TODO: handle not resolvable reference
                var craft = scope[element.name]
                if (craft === undefined)
                    throw 'can not resolve <' + element.name + '>'

                // pass attribs as parameters
                var childScope = scope.clone()
                childScope.parent = scope
                childScope.solids = [] // no solids, start from scratch

                childScope.parameters = resolveAttributesToParameters(scope, element.attribs, craft)

                childScope.callee = element

                // childScope.callees = childScope.callees || []
                childScope.callees.push(element) 

                var solids = render(craft.children, childScope)

                // apply x, y, z offsets (if any)
                if (element.attribs.x){
                    solids.forEach(function(solid){
                        var resolved = resolveAttribueValue(scope, element.attribs.x)
                        solid.layout.location.x = Number(resolved)
                    })
                }

                if (element.attribs.y){
                    solids.forEach(function(solid){
                        var resolved = resolveAttribueValue(scope, element.attribs.y)
                        solid.layout.location.y = Number(resolved)
                    })
                }

                if (element.attribs.z){
                    solids.forEach(function(solid){
                        var resolved = resolveAttribueValue(scope, element.attribs.z)
                        solid.layout.location.z = Number(resolved)
                    })
                }                

                return solids

            }

        } else if (element.type === 'script') {

            var ret = element.run(scope.parameters, scope)
            if (_.isString(ret)){

                var xml = ret
                var c = parse(xml)                            
                var solids = render(c, scope)
                return solids

            }

        } else if (element.type === 'factory') {

            var parameters = scope.parameters

            return element.create(parameters)

        }

    }

    // return arg
}