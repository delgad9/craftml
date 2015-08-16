import Promise from 'bluebird'
import _ from 'lodash'
import openjscad from '../scad'
import chai from 'chai'
import query from '../query'
import errors from '../errors'

export default function render_script($scope, $element) {

    let type = $element.attribs['type']
    let evalFunc
    if (type == 'text/openjscad'){
        return evalOpenJscad(this, $element.code, $scope.parameters, $scope)
    } else {
        return evalDefault(this, $element.code, $scope.parameters, $scope)
            .catch(err => {

                let context = $element.context
                let i = $element.startIndex
                let lines = context.contents.slice(context.offset, $element.startIndex).split('\n')
                let lineno = lines.length
                err.lineno += lineno

                let e = _.clone(err)
                e.message = err.message
                throw new errors.ScriptError(e)
            })
    }        
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
    }).join(';')

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

import check from 'syntax-error'
function evalDefault($solid, code, params, $scope) {

    let $ = query($solid)

    let locals = {
        $,
        expect: chai.expect,
        require: custom_require,
        $scope: $scope.parameters,
        $crafts: $scope.crafts
    }

    // for backward compatibility of scope.solids
    let backcompScope = {
        solids: $solid.children
    }

    $solid.$scope = $scope

    let stmts = localFunctionStatements(locals)
    // console.log(stmts + ';' + code)

    try {
        let f = new Function('params', 'scope', 'locals',
            "'use strict';" + stmts + ';' +
            code)

        f.call($solid, params, backcompScope, locals)

    } catch (err) {

        let offset = 3
        if (err.name == 'SyntaxError'){
            let ch = check(code)
            let lineNumber = ch.line - 1
            return Promise.reject({lineno: lineNumber, message: ch.message})
        } else if (err.stack.match(/<anonymous>/)){
            let ms = err.stack.match(/<anonymous>:(\d*):(\d*)/)
            let lineNumber = ms[1] - offset
            let pos = ms[2] - 0
            return Promise.reject({lineno: lineNumber, pos: pos, message: err.message})
        } else {
            return Promise.reject({lineno: 0,message: err.message})
        }
    }

    return Promise.all($solid.promises)
}
