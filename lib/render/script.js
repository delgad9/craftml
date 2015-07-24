import Promise from 'bluebird'
import _ from 'lodash'
import openjscad from '../scad'
import chai from 'chai'
import query from '../query'

export default function render_script($solid, $element, $scope) {

    let type = $element.attribs['type']

    let evalFunc
    if (type == 'text/openjscad'){
        evalFunc = evalOpenJscad
    } else {
        evalFunc = evalDefault
    }

    return evalFunc($solid, $element.code, $scope.parameters, $scope)
        .then(function(ret) {

            if (_.isString(ret)) {
                var xml = ret

                return parse(xml)
                    .then(function(c) {
                        return render(c, $scope)
                    })

            } else {

                return ret
            }
        })
}

// useful modules that can be required
let modules = {
    'lodash' : _
}

// define our own require function
function custom_require(moduleId){
    return modules[moduleId]
}

function localFunctionStatements(locals){

    // expose openjscad functions to main()
    let statements = _.functions(locals).map(function(f) {
        // 'var cube = $$$.cube'
        var stmt = 'var ' + f + ' = locals.' + f
        return stmt
    }).join('\n')

    return statements
}

function evalOpenJscad($solid, code, params, $scope){
    let locals = openjscad

    let f
    if (code.match(/function\s*main\(.*\)/)){

        f = new Function('params', 'locals',
            localFunctionStatements(locals) + ';' +
            code +
            '; return main(params);')

        let csg = f(params, locals)
        if (csg){
            $solid.add(csg)
        }

    } else {

        f = new Function('params', 'locals',
            localFunctionStatements(locals) + ';' +
            code)
    }

    let result = f.call($solid, params, locals)
    return Promise.resolve(result)
}

function evalDefault($solid, code, params, $scope) {

    //let root = findRoot(scope.solid)

    let $ = query($solid)

    let locals = {
        $,
        expect: chai.expect,
        require: custom_require
    }

    // determine how many arguments are specified
    // let mainArgumentsString = code.match(/function\s*main\((.*)\)/)[1] || ''
    // let numberOfArguments = mainArgumentsString.split(',').length

    // if (numberOfArguments < 3) {
        // no cb specified (e.g., function main(params, scope))

        // sync
        let f = new Function('params', 'scope', 'locals',
            localFunctionStatements(locals) + ';' +
            code)

        let result = f.call($solid, params, $scope, locals)
        return Promise.resolve(result)

    // } else {
    //     // no cb specified (e.g., function main(params, scope, cb))
    //
    //     // async
    //
    //     let f = new Function('params', 'scope', 'locals', 'cb',
    //         localFunctionStatements(locals) + ';' +
    //         code +
    //         '; return main(params, scope, cb);')
    //
    //     // async
    //     return Promise
    //         .promisify(f)(params, scope, locals)
    // }

    // return promise
}
