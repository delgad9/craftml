var _ = require('lodash'),
    addWith = require('with'),
    _s = require('../solids'),
    Solid = require('../solid'),
    Location = require('../location')

function isMatch(solid, selector){
    var name = selector.slice(1)
    if (selector[0] == '#'){
        return solid.id == name
    } else if (selector[0] == '.'){
        return solid.class == name
    } else {
        return false
    }
}

function select(solids, selector){
    return _.flatten(_.map(solids, function(solid){
        var selected = []
        if (isMatch(solid, selector)){
            selected.push(solid)
        }
        return selected.concat(select(solid.children, selector))
    }))
}

function notselect(solids, selector){
    return _.flatten(_.map(solids, function(solid){
        var selected = []
        if (!isMatch(solid, selector)){
            selected.push(solid)
        }
        return selected.concat(select(solid.children, selector))
    }))
}


function align(solids, dim, v, grouped){
    var first = solids[0]
    solids.slice(1).forEach(function(solid) {
        var newLoc = _.clone(solid.layout.location)
        var percent = v
        if (!isNaN(percent)) {
            newLoc[dim] = first.layout.location[dim] +
                (first.layout.size[dim] - solid.layout.size[dim]) * percent / 100
        }
        solid.translateTo(newLoc.x, newLoc.y, newLoc.z)
    })
}

function alignEval(code, solids, grouped){

    // e.g.,
    //
    // code = 'x50 y50'
    //
    // code = 'x50 y100 z0'
    //
    // code = 'x-50 y100 z0'

    var toks = code.split(' ')

    function parse(e){
        var m = e.match(/(x|y|z)(-*\d+)/)
        return {
            dim: m[1],
            value: m[2]
        }
    }

    _.forEach(toks, function(tok){
        var p = parse(tok)
        align(solids, p.dim, p.value, grouped)

    })
}



module.exports = function(render, element, scope) {
    // must refer to something previously defined

    var craft = scope.crafts[element.name]
    var part = scope.parts[element.name]

    if (!craft && !part){
        throw 'can not resolve <' + element.name + '>'
    }

    var toRender = craft || part

    // take care of scope and parameters

    var childScope = scope.clone()
    childScope.solids = [] // no solids, start from scratch
    childScope.isRoot = true
    childScope.parent = scope
    childScope.caller = element

    var params = resolveAttributesToParameters(scope, element.attribs, toRender)
    if (craft){
        childScope.parameters = params
    } else if (part){
        var lexicallyScopedParams = _.merge(_.clone(scope.parameters), params)
        childScope.parameters = lexicallyScopedParams
    }

    childScope.element = element

    return render(toRender, childScope)
        .then(function(solids) {

            var loc = {}
            // apply x, y, z offsets (if any),
            // but not for those using x, y, z as parameters (e.g., scale, crop)
            var dims = ['x', 'y', 'z']
            dims.forEach(function(dim) {
                if (element.attribs[dim] && !doesCraftHaveParameterByName(toRender, dim)) {
                    var resolved = resolveAttribueValue(scope, element.attribs[dim])
                    loc[dim] = Number(resolved)
                }
            })

            solids.forEach(function(solid) {
                var oldloc = _.clone(solid.layout.location)
                var newloc = _.merge(oldloc, loc)
                // console.log(solid)
                solid.translateTo(newloc.x, newloc.y, newloc.z)//new Location(newloc.x,newloc.y,newloc.z))
            })


            // apply color
            if (element.attribs['color']){
                solids.forEach(function(solid) {
                    solid.color = element.attribs['color']
                })
            }

            // apply class
            if (element.attribs['class']){
                var className = element.attribs['class']
                solids.forEach(function(solid) {
                    solid.class = className
                })
            }

            // apply id
            if (element.attribs['id']){
                var id = element.attribs['id']
                solids.forEach(function(solid) {
                    solid.id = id
                })
            }


            // apply align
            if (element.attribs['align']){
                var code = element.attribs['align']
                var resolved = resolveAttribueValue(scope, code)

                solids.forEach(function(solid) {

                    if (element.attribs['select']){

                        console.log('[ALIGN SELECT]')

                        var select = require('./select')
                        var selector = element.attribs['select']
                        var selected = select(solid.children, selector)
                        var top = solid

                        var s1 = selected[0]
                        var s2 = selected[1]

                        console.log('s1.layout', JSON.stringify(s1.layout))
                        console.log('s2.layout', JSON.stringify(s2.layout))
                        console.log('top.layout', JSON.stringify(top.layout))

                        // console.log('[align] top id=', element.attribs['id'], JSON.stringify(top.layout))
                        _.forEach(selected, function(s){
                            s.convertCoordinateTo(top)
                        })

                        //     return selected//console.log(selected)
                        // }
                        // console.log('[align]', selected)
                        // alignEval(resolved, selected, true)

                        console.log('after convert')
                        // s1.translateTo(35,0,10,true)
                        // s1.translateTo(35,0,10,true)
                        console.log('s1.layout', JSON.stringify(s1.layout))
                        console.log('s2.layout', JSON.stringify(s2.layout))
                        // s1.translateTo(0,0,0)
                        // s1.translateTo(0,0,0)
                        // s1.translateTo(0,0,0,true)
                        // s1.translateTo(0,0,0,true)
                        // s1.translateTo(0,0,0,true)

                        alignEval(resolved, selected, true)

                        // _.forEach(selected, function(s){
                        //     s.layout.revert()
                        //     // console.log('s.layout', JSON.stringify(s.layout))
                        // })

                        top.fitToChildren()

                    } else {

                        alignEval(resolved, solid.children, false)
                        solid.fitToChildren()
                    }
                })
            }

            // apply layout (deprecated)
            if (element.attribs['layout']){
                var code = element.attribs['layout']
                var resolved = resolveAttribueValue(scope, code)
                solids.forEach(function(solid) {
                    solid.layoutEval(resolved)
                })
            }

            // apply transform
            if (element.attribs['transform']){
                var code = element.attribs['transform']
                // var resolved = evalAttributeValue(scope, code)
                solids.forEach(function(solid) {
                    solid.transformEval(code, scope.parameters)
                })
            }

            // apply cut
            if (element.attribs['cut']){
                var selector = element.attribs['cut']
                var selected = select(solids, selector)
                var notselected = notselect(solids, selector)

                // selected.forEach(function(solid){
                //     solid.cut = true
                // })

                solids.forEach(function(solid) {
                    solid.apply()
                })

                var csg0 = _s(selected).union()
                var csg1 = _s(notselected).union()

                var csg = csg1.subtract(csg0)
                var solid = new Solid(csg)
                solids = [solid]
            }

            return solids
        })

}

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

        // if the expression has any {{ }}
        var res = value.match(/{{(.*)}}/)
        if (res) {


            if (value.match(/^{{([^{^}]*)}}$/)){
                // <foo x="{{obj}}"/>

                // console.log('eval as an object')

                var o = {}
                var expr = res[1]
                var withExpr = addWith('scope.parameters', 'o.v = ' + expr)
                eval(withExpr)
                // console.log(o.v)
                return o.v

            } else {
                // <foo x="bar({{obj}})"/>

                // console.log('eval as a template')
                _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
                var compiled = _.template(value)
                var ret = compiled(scope.parameters)
                return ret
            }

        } else {

            return value
        }

    } else {

        return value
    }
}

function doesCraftHaveParameterByName(craft, attrName){
    return hasParameterByName(craft.children, attrName)
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
