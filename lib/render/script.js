import Promise from 'bluebird'
import _ from 'lodash'
import openjscad from '../scad'
import Solid from '../solid'
import chai from 'chai'

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

function _eval(code, type, params, scope) {

    let locals = {
        Solid,
        expect: chai.expect,
        require: custom_require
    }

    if (type == 'text/openjscad'){
        locals = _.extend(locals, openjscad)
    }

    // determine how many arguments are specified
    let mainArgumentsString = code.match(/function\s*main\((.*)\)/)[1] || ''
    let numberOfArguments = mainArgumentsString.split(',').length

    if (numberOfArguments < 3) {
        // no cb specified (e.g., function main(params, scope))

        // sync

        let f = new Function('params', 'scope', 'locals', 'solid',
            localFunctionStatements(locals) + ';' +
            code +
            '; return main.call(solid, params, scope);')

        // let solid = {
        //     children: [1]
        // }
        // console.log('script:scope.parent', scope.parent.solid)
        let result = f(params, scope, locals, scope.parent.solid)
        return Promise.resolve(result)

    } else {
        // no cb specified (e.g., function main(params, scope, cb))

        // async

        let f = new Function('params', 'scope', 'locals', 'cb',
            localFunctionStatements(locals) + ';' +
            code +
            '; return main(params, scope, cb);')

        // async
        return Promise
            .promisify(f)(params, scope, locals)
    }

    return promise
}


export default function _render_script(render, element, scope) {

    let type = element.attribs['type']
    return _eval(element.code, type, scope.parameters, scope)
        .then(function(ret) {
            if (_.isString(ret)) {
                var xml = ret
                return parse(xml)
                    .then(function(c) {
                        return render(c, scope)
                    })

            } else if (ret && ret.polygons) {

                // ret.properties.type = 'mesh'
                var solid = new Solid(ret)
                solid.role = 'csg'
                solid.element = {
                    name: 'csg'
                }
                // auto translate to (0,0)
                solid.translateTo(0,0,0)
                // return solid
                // console.log(solid)
                scope.solid.children.push(solid)
                scope.solid.fitToChildren()
                // return solid

            } else if (ret && ret.sides){

                var p = ret.toCSGPolygon()
                p.properties.type = 'lines'
                var solid = new Solid(p)
                // auto translate to (0,0)
                // solid.translateTo(new Location(0,0,0))
                solid.type = 'lines'
                return solid

            } else {
                return ret
            }
        })
}
