import _ from 'lodash'
import Promise from 'bluebird'
import Scope from '../scope'
import _tag from './tag'
import _script from './script'
import _craft from './craft'
import _stl from './stl'
import _repeat from './repeat'
import _part from './part'
import _content from './content'
import _parameter from './parameter'
import _path from './path'
import _solidify from './solidify'

let renderers = []

function register(type, name, func){
    renderers.push({type, name, func})
}

function find(type, name) {
    return _.find(renderers, {type, name})
}

register('tag', 'craft', _craft)
register('tag', 'stl', _stl)
register('tag', 'repeat', _repeat)
register('tag', 'part', _part)
register('tag', 'content', _content)
register('tag', 'parameter', _parameter)
register('tag', 'info', _.partial(Promise.resolve, []))
register('tag', 'path', _path)
register('tag', 'solidify', _solidify)

export default function render(arg, scope) {

    if (!scope){
        scope = new Scope()
        scope.isRoot = true
    }

    if (_.isArray(arg)) {

        // arg is [element]

        var childrenScope = scope.clone()
        childrenScope.solids = []

        return Promise
            .each(arg, function(element, i) {

                return render(element, childrenScope)
                    .then(function(solids) {

                        if (_.isArray(solids)) {
                            childrenScope.solids = childrenScope.solids.concat(solids)
                        } else if (solids) {
                            childrenScope.solids.push(solids)
                        }

                    })
            })
            .then(function() {
                return childrenScope.solids
            })
            .then(_.flatten)
            .then(_.compact)

    } else if (arg){

        // arg is element
        var element = arg
        let r = find('tag', element.name)
        if (r){
            return r.func(render, element, scope)

        } else if (element.type === 'tag'){

            return _tag(render, element, scope)

        } else if (element.type === 'script'){

            return _script(render, element, scope)

        } else {
            return []
        }

    }
}
