var Promise = require("bluebird"),
    _ = require('lodash')

module.exports = function(render, element, scope) {

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
    if (type === 'int' || type === 'float') {

        val = Number(val)

    } else if (type === 'string') {

        val = '' + val

    } else if (type === 'percent') {


        if (_.isString(val)){

            var p = val.match(/(\d+)%/)
            if (p){

                val = Number(p[1])
            } else {
                val = Number(val)
            }

        } else {

            val = val
        }

    } else if (type === 'expression') {

        val = eval(val)

    } else if (type === 'measure') {
        console.log('measure', val)
        if (_.isString(val)){


            var p = val.match(/(\d+)%/)
            if (p){
                val = {
                    unit: 'percent',
                    value: Number(p[1])
                }
            } else if (val.length > 0) { // non-empty

                val = {
                    unit: 'mm',
                    value: Number(val)
                }
            }



        } else {

            val = {
                    unit: 'mm',
                    value: val
                }
        }


    } else {

        // is it an expression?
        //var m
        if (_.isString(val) && (m = val.match(/{{(.*)}}/))){
            // if so, eval it
            var expr = m[1]
            val = eval(expr)
        }

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
