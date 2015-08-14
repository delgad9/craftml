import _ from 'lodash'
import Promise from 'bluebird'
import css from 'css'

import Scope from '../scope'
import Solid from '../solid'

import _tag from './tag'
import _script from './script'
import _craft from './craftDef'
import _stl from './stl'
import _repeat from './repeat'
import _content from './content'
import _parameter from './parameter'
import _path from './path'
import _solidify from './solidify'
import _text from './text'
import _div from './div'
import _style from './style'
import _braille from './braille'
import _group from './group'
import _point from './point'

import attributes from './attribs'

import query from '../query'

import getParamNames from 'get-parameter-names'

import errors from '../errors'


function assert(solid, expr, msg){
    let context = solid.src.context
    if (!expr){
        let i = solid.src.startIndex
        let lines = context.contents.slice(context.offset, solid.src.startIndex).split('\n')
        let lineno = lines.length
        if (context.path){
            throw new errors.RenderError({message: msg, lineno: lineno, path: context.path})
        } else {
            throw new errors.RenderError({message: msg, lineno: lineno})
        }
    }
}

class Renderer {

    constructor(type, name, mode, func){
        this.type = type
        this.name = name
        this.mode = mode
        this.func = func
        this.depNnames = getParamNames(this.func)
    }

    render(solid, $scope) {

        let $ = query(solid)
        let $assert = _.partial(assert, solid)

        let deps = {
            $scope,
            $,
            $assert
        }

        let args = _.map(this.depNnames, _.partial(_.get, deps))
        return Promise.resolve(this.func.apply(solid, args))
            .then(() => {

                if (this.mode == 'define') {
                    _.remove(solid.parent.children, solid)

                } else if (this.mode == 'merge' || solid.role == 'merge'){
                    // perform merge
                    _.remove(solid.parent.children, solid)
                    _.forEach(solid.children, c =>{
                        solid.parent.add(c)
                    })
                }

            })
    }
}


let _renderers = []
function use_(type, names, options, func){

    // let names
    if (_.isString(names)){
        names = [names]
    }

    _.forEach(names, name => {
        let ren = new Renderer(type, name, options, func)
        _renderers.push(ren)
    })
}

use_('tag', ['craft', 'part'], 'define', _craft)
use_('tag', 'part', 'define', _craft)
use_('tag', 'stl', 'create',  _stl)
use_('tag', 'repeat', 'merge', _repeat)
use_('tag', 'content', 'merge', _content)
use_('tag', 'parameter', 'define', _parameter)
use_('tag', 'info', 'define', _.partial(Promise.resolve, []))
use_('tag', 'path', 'create', _path)
use_('tag', 'solidify', 'create', _solidify)
use_('tag', ['div','h1','h2','h3','h4','h5'], 'create', _div)
use_('style', 'style', 'define', _style)
use_('tag', 'braille', 'create', _braille)
use_('tag', 'g', 'create', _group)
use_('tag', 'point', 'create', _point)
use_('script', 'script', 'script', _script)
use_('tag', 'text', 'create', _text)
use_('text', 'text', 'create', _text)

function lookup(type, name){
    let r =  _.find(_renderers, {type: type, name: name})
    if (!r){
        // console.log(type, name, r)
        r = new Renderer(type, name, 'create', _tag)
    }
    return r
}


function createNewSolid(element, $scope, parent){
    let solid = new Solid()
    solid.role = 'group'
    solid.id = _.get(element, 'attribs.id')
    solid.name = element.name
    // solid.attribs = {}
    // _.forIn(element.attribs, (value, key) =>{
    //     solid.attribs[key] = $scope.resolve(value)
    // })
    solid.$scope = $scope
    solid.src = element

    if (parent){
        parent.add(solid)
    }

    return solid
}

import * as attr from './attribs'

export default function render(element, $scope) {

    // get rid of empty children
    // empty text tag would be converted to 'undefined'
    // element.children = _.compact(element.children)

    if (!$scope){
        $scope = new Scope()
    }

    let renderer = lookup(element.type, element.name)
    if (renderer.mode == 'script'){

        return _script.call(this, $scope, element)

    } else {

        let solid = createNewSolid(element, $scope, this)

        solid.attribs = {}
        _.forIn(element.attribs, (value, key) =>{
            try {
                solid.attribs[key] = $scope.resolve(value)
            } catch(err){
                assert(solid, !err, `unable to resolve ${key}="${value}" because ${err.message}`)
            }
        })



        attr.style.call(solid, $scope)

        return renderer
            .render(solid, $scope)
            .then(() => {

                try {
                    attr.layout.call(solid, $scope)
                } catch(err){
                    assert(solid, !err, `unable to layout because ${err}`)
                }

                attr.cut.call(solid, $scope)

                try {
                    attr.transform.call(solid, $scope)
                } catch(err){
                    assert(solid, !err, `unable to transform because ${err}`)
                }
                return solid
            })
            // .catch(err => {
            //     console.log(err.message)
            // })
    }
}

// return a list of Solid objects, one for each child of 'element'
export function renderElementList($solid, elements, $scope){
    let childScope = $scope.clone()
    childScope.parent = $scope
    return Promise
        .each(elements, element => {
            return render.call($solid, element, childScope)
                .then(()=>{
                    // after each child is fully constructed, update the bound
                    $solid.fitToChildren()
                })
        })
}
