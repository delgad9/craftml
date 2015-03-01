var Promise = require("bluebird"),
    get = require('get-parameter-names'),
    _ = require('lodash'),
    parse = require('../parse')

function _eval(code, params, scope) {

    // prepare 'require'
    var req = module.require
    var require = function(moduleId) {
        try {
            var m = req(moduleId)
            return m
        } catch (err) {
            // load from cwd()
            return req('./' + moduleId)
        }
    }
    var params = scope.parameters

    var o = {}
        // eval to gain access to main() as a function object    
        // TODO: it seems main() would be defined as a global variable
    eval(code + '; o.main = main;')

    var promise = new Promise(function(resolve, reject) {

        if (get(o.main).length < 3) {
            // no cb specified

            // sync
            var result = o.main(params, scope)            
            resolve(result)

        } else {
            // a cb is given            

            // async
            o.main(params, scope, function(error, result) {
                if (error) {
                    reject()
                }                               
                resolve(result)
            })
        }
    })


    return promise
}


module.exports = function(render, element, scope) {

    // console.log(element)

    return _eval(element.code, scope.parameters, scope)
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
}