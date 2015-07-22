import Promise from 'bluebird'
import _ from 'lodash'
import openjscad from '../scad'
import Solid from '../solid'
import chai from 'chai'
import query from '../query'

// useful modules that can be required
// TODO: add jquery?
let modules = {
    'lodash' : _
}

// define out own require function
function custom_require(moduleId){
    return modules[moduleId]
}

// req = module.require
// var require = function(moduleId) {
//     try {
//         var m = req(moduleId)
//         return m
//     } catch (err) {
//         // load from cwd()
//         return req('./' + moduleId)
//     }
// }

function localFunctionStatements(locals){

    // expose openjscad functions to main()
    let statements = _.functions(locals).map(function(f) {
        // 'var cube = $$$.cube'
        var stmt = 'var ' + f + ' = locals.' + f
        return stmt
    }).join('\n')

    return statements
}

// function _eval1(code, type, params, scope) {
//
//     let locals = {
//         Solid,
//         $: query,
//         expect: chai.expect,
//         require: custom_require
//     }
//
//     if (type == 'text/openjscad'){
//         locals = _.extend(locals, openjscad)
//     }
//
//     // determine how many arguments are specified
//     let mainArgumentsString = code.match(/function\s*main\((.*)\)/)[1] || ''
//     let numberOfArguments = mainArgumentsString.split(',').length
//
//     if (numberOfArguments < 3) {
//         // no cb specified (e.g., function main(params, scope))
//
//         // sync
//
//         let f = new Function('params', 'scope', 'locals', 'solid',
//             localFunctionStatements(locals) + ';' +
//             code +
//             '; return main.call(solid, params, scope);')
//
//         // let solid = {
//         //     children: [1]
//         // }
//         // console.log('script:scope.parent', scope.parent.solid)
//         let result = f(params, scope, locals, scope.parent.solid)
//         return Promise.resolve(result)
//
//     } else {
//         // no cb specified (e.g., function main(params, scope, cb))
//
//         // async
//
//         let f = new Function('params', 'scope', 'locals', 'cb',
//             localFunctionStatements(locals) + ';' +
//             code +
//             '; return main(params, scope, cb);')
//
//         // async
//         return Promise
//             .promisify(f)(params, scope, locals)
//     }
//
//     return promise
// }

function evalOpenJscad(code, params, scope){
    let locals = openjscad

    let f
    if (code.match(/function\s*main\(.*\)/)){

        f = new Function('params', 'locals',
            localFunctionStatements(locals) + ';' +
            code +
            '; return main(params);')

        let csg = f(params, locals)
        if (csg){
            scope.solid.add(csg)
        }

    } else {

        f = new Function('params', 'locals',
            localFunctionStatements(locals) + ';' +
            code)
    }

    let result = f.call(scope.solid, params, locals)
    return Promise.resolve(result)
}

function evalDefault(code, params, scope) {

    //let root = findRoot(scope.solid)

    let $ = query(scope.solid)

    let locals = {
        Solid,
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
            //'; return main.call(solid, params, scope);')

        // let solid = {
        //     children: [1]
        // }
        // console.log('script:scope.parent', scope.parent.solid)
        let result = f.call(scope.solid, params, scope, locals)
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


export default function _render_script(render, element, scope) {

    let type = element.attribs['type']

    let evalFunc
    if (type == 'text/openjscad'){
        evalFunc = evalOpenJscad
    } else {
        evalFunc = evalDefault
    }

    return evalFunc(element.code, scope.parameters, scope)
        .then(function(ret) {

            if (_.isString(ret)) {
                var xml = ret

                return parse(xml)
                    .then(function(c) {
                        return render(c, scope)
                    })

            } else {

                return ret
            }
        })
}
