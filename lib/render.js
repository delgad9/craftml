var _ = require('lodash'),
    Promise = require("bluebird"),
    Solid = require('./solid'),
    Group = require('./group'),
    Scope = require('./scope'),
    parse = require('./parse'),
    fs = require('fs')

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


function resolveAttribueValue(scope, value) {
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

        return Promise
            .each(arg, function(element, i){

                return render(element, childrenScope)
                    .then(function(solids) {

                        // console.log('*add solid %d', i)
                        // console.log('%d solids', childrenScope.solids.length)

                        if (_.isArray(solids)) {
                            childrenScope.solids = childrenScope.solids.concat(solids)
                        } else if (_.isObject(solids)) {
                            childrenScope.solids.push(solids)
                        }

                    })
            })
            .then(function() {
                return childrenScope.solids
            })
            .then(_.flatten)
            .then(_.compact)

    } else {

        // arg is element
        var element = arg

        scope.trace = scope.trace || []
        scope.trace.push(element.type + ":" + element.name)


        if (element.type === 'tag') {


            if (element.name === 'group') {

                var promises = element.children.map(function(child) {
                    return render(child, scope)
                })

                return Promise
                    .all(promises)
                    .then(function(solids) {

                        var grp = new Group()
                        grp.children = _.flatten(solids)
                        grp.fitToChildren()
                        return grp

                    })

                // var grp = new Group()
                // grp.children = _.flatten(element.children.map(function(child) {
                //     return render(child, scope)
                // }))
                // grp.fitToChildren()
                // return grp

            } else if (element.name === 'scale') {

                var grp = new Group()
                grp.children = _.flatten(element.children.map(function(child) {
                    return render(child, scope)
                }))
                grp.fitToChildren()
                var s
                if (element.attribs.factor) {
                    var f = Number(element.attribs.factor)
                    s = [f, f, f]
                } else {
                    var x = Number(element.attribs.x) || 1
                    var y = Number(element.attribs.y) || 1
                    var z = Number(element.attribs.z) || 1
                    s = [x, y, z]
                }
                grp.scale(s)
                return grp

                // } else if (element.name === 'crop') {

                //     var grp = new Group()
                //     grp.children = _.flatten(element.children.map(function(child) {
                //         return render(child, scope)
                //     }))
                //     grp.fitToChildren()
                //     grp.crop(element.attribs.x)
                //     return grp

            } else if (element.name === 'stl') {

                var stl = require('./stl')
                var src = element.attribs['src']

                console.log('importing %s', src)
                var stlstring = fs.readFileSync(src, 'binary')
                var csg = stl.parse(stlstring, src)
                var solid = new Solid(csg)

                // TODO: make this settable
                // normalize to fit a cubic volume of 'targetDim'
                var normalize = true
                if (normalize) {
                    var targetDim = 20
                    var bs = csg.getBounds()
                    var xs = bs[1].x - bs[0].x
                    var ys = bs[1].y - bs[0].y
                    var zs = bs[1].z - bs[0].z
                    var maxDim = _.max([xs, ys, zs])
                    var factor = targetDim / maxDim

                    solid.layout.scale = {
                        x: factor,
                        y: factor,
                        z: factor
                    }

                    solid.layout.size = {
                        x: xs * factor,
                        y: ys * factor,
                        z: zs * factor
                    }

                    solid.layout.location = {
                        x: 0,
                        y: 0,
                        z: 0
                    }
                }

                if (element.attribs.crop) {
                    var crop = element.attribs.crop
                    var p = crop.split(',')
                    solid.crop = {
                        x: [p[0], p[1]],
                        y: [p[2], p[3]],
                        z: [p[4], p[5]]
                    }
                }

                return solid

            } else if (element.name === 'craft') {

                // console.log(element)                
                return new Promise(function(resolve, reject) {
                    scope[element.attribs['name']] = element
                    resolve(null)
                })

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

                // does not render to anything
                return new Promise(function(resolve, reject) {                    
                    resolve(null)
                })
                // return undefined // does not render to anything

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

                return render(craft.children, childScope)
                    .then(function(solids) {

                        // apply x, y, z offsets (if any)
                        var dims = ['x', 'y', 'z']
                        dims.forEach(function(dim) {

                            if (element.attribs[dim]) {
                                solids.forEach(function(solid) {
                                    var resolved = resolveAttribueValue(scope, element.attribs[dim])
                                    solid.layout.location[dim] = Number(resolved)
                                })
                            }

                        })

                        return solids
                    })
            }

        } else if (element.type === 'script') {

            return new Promise(function(resolve, reject) {
                    var ret = element.run(scope.parameters, scope)
                    resolve(ret)
                })
                .then(function(ret) {
                    if (_.isString(ret)) {

                        var xml = ret
                        var c = parse(xml)
                        return render(c, scope)
                            // return solids
                    } else {

                        return ret
                    }
                })

        } else if (element.type === 'factory') {

            var parameters = scope.parameters

            return new Promise(function(resolve, reject) {
                // console.log('*factory')
                var solid = element.create(parameters)
                    // console.log('*factory:create')
                if (solid) {
                    resolve(solid)
                } else {
                    reject()
                }
            })
        }

    }

    // return arg
}