var Promise = require("bluebird"),
    _ = require('lodash')


function parseAsType(val, type) {
    if (type === 'int' || type === 'float') {

        return Number(val)

    } else if (type === 'string') {

        return '' + val

    } else if (type === 'percent') {


        if (_.isString(val)) {

            var p = val.match(/(\d+)%/)
            if (p) {

                return Number(p[1])
            } else {
                return Number(val)
            }

        } else {

            return val
        }
    } else if (type === 'size') {

        return parseSize(val)

    } else if (type === 'expression') {

        return eval(val)

    } else if (type === 'measure') {

        if (_.isString(val)) {


            var p = val.match(/(\d+)%/)
            if (p) {
                return {
                    unit: 'percent',
                    value: Number(p[1])
                }
            } else if (val.length > 0) { // non-empty

                return {
                    unit: 'mm',
                    value: Number(val)
                }
            }



        } else {

            return {
                unit: 'mm',
                value: val
            }
        }


    } else {

        // is it an expression?
        if (_.isString(val) && (m = val.match(/{{(.*)}}/))) {
            // if so, eval it
            var expr = m[1]
            return eval(expr)
        } else {

            // return as is
            return val

        }

    }
}


function parseSize(val) {
    // size: 10 20 30
    // console.log('val',val)

    if (_.isString(val)){

        var toks = val.split(' ')
        // TODO: assert(toks.length === 3)

        return {
            x: Number(toks[0]),
            y: Number(toks[1]),
            z: Number(toks[2])
        }
    } else {
        return undefined
    }

    // var toks = val.split(' ')
    //
    // function parse(e) {
    //     var m = e.match(/(x|y|z)(\d+)/)
    //     return {
    //         dim: m[1],
    //         value: m[2]
    //     }
    // }
    //
    // var o = {}
    // _.forEach(toks, function(tok) {
    //     var p = parse(tok)
    //     o[p.dim] = Number(p.value)
    // })
    // return o
}

module.exports = function(render, element, scope) {

    var name = element.attribs['name'],
        type = element.attribs['type']

    var val
    if (!(name in scope.parameters)) {
        // not set by the caller
        // use the default value
        val = parseAsType(element.attribs['default'], type)

    } else {

        var rawValue = scope.parameters[name]
        val = parseAsType(rawValue, type)
    }

    if (val === undefined) {
        val = ''
    }

    scope.parameters[name] = val

    // does not render to anything
    return new Promise(function(resolve, reject) {
        resolve(null)
    })

}
