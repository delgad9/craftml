import Promise from 'bluebird'
import _ from 'lodash'
import openjscad from '../scad'
import chai from 'chai'
import query from '../query'

export default function render_script($scope, $element) {

    let type = $element.attribs['type']
    let evalFunc
    if (type == 'text/openjscad'){
        evalFunc = evalOpenJscad
    } else {
        evalFunc = evalDefault
    }

    // console.log($element.code)

    //return evalFunc(this, $element.code, $scope.parameters, $scope)
    return evalFunc(this, $element.code, $scope.parameters, $scope)
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
    let statements = _.map(_.keys(locals), function(f) {
        // 'var cube = $$$.cube'
        var stmt = 'var ' + f + ' = locals.' + f
        return stmt
    }).join('\n')

    return statements
}

function evalOpenJscad($solid, code, params, $scope){
    let locals = openjscad

    // $solid = $solid.parent

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

    // $solid = $solid.parent

    let locals = {
        $,
        expect: chai.expect,
        require: custom_require,
        $scope: $scope.parameters
    }

    // for backward compatibility of scope.solids
    let backcompScope = {
        solids: $solid.children
    }

    // sync
    let f = new Function('params', 'scope', 'locals',
        localFunctionStatements(locals) + ';' +
        code)
    let result = f.call($solid, params, backcompScope, locals)

    // resolve children (some of which could be promises)
    return Promise.all($solid.promises)

}
