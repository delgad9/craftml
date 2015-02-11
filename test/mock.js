var lib = {}

var Solid = require('../lib/solid1')

function make(name) {

    var f = function() {
        var args = Array.prototype.slice.call(arguments)

        var el = {
            type: 'tag',
            name: name,
            attribs: {}
        }

        var children = []

        args.forEach(function(arg) {

            if ('a' in arg) {
                _.extend(el.attribs, arg.a)

            } else {

                children.push(arg)
            }

            // console.log('arg',arg)

        })

        // console.log(el.attribs)

        if (name === 'script' || name === 'factory' || name === 'unit') {
            el.type = 'factory'
            // el.attribs.type = 'text/openjscad'
            el.create = function() {
                var s = new Solid()
                s.layout = {
                    size: {
                        x: 1,
                        y: 1,
                        z: 1
                    },
                    location: {
                        x: 0,
                        y: 0,
                        z: 0
                    }
                }
                return s
            }
            delete el.children

        } else {
            //el.type = 'tag'
            el.children = children
        }

        return el
    }

    lib[name] = f
}

make('craft')
make('parameter')
make('content')
make('u1')
make('u2')
make('csg')
make('foo')
make('factory')
make('unit')
make('group')
make('solid')

lib.a = function(name, value) {
    var o = {}
    o[name] = value
    return {
        a: o
    }
}

lib.solid = function() {
    return {
        type: 'solid'
    }
}

lib.grp = function() {
    var args = Array.prototype.slice.call(arguments)

    return {
        type: 'group',
        children: args
    }
}

lib.script = function(func){
    return {
        type: 'script',
        run: func
    }
}

module.exports = lib

