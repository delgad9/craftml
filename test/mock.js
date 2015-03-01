var lib = {}

var _ = require('lodash')

var Solid = require('../lib/solid')

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
make('stl')
make('crop')
make('scale')


// delete lib.text.children

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

lib.solidGroup = function() {
    var args = Array.prototype.slice.call(arguments)

    return {
        type: 'group',
        layout: {
            location: {
                x: 0,
                y: 0,
                z: 0
            },
            size:{
                x: 1,
                y: 1,
                z: 1
            }
        },
        children: args
    }
}

lib.text = function(string){
    return {
        type: 'tag',
        name: 'text',
        attribs: {text: string}
    }
}

lib.script = function(code) {
    return {
        type: 'script',
        code: code
    }
}

var $$$ = require('craft-scad')
lib.cube = function() {
    var solid = new Solid()
    solid.name = 'cube'
    solid.create = function(params) {
        return $$$.cube()
    }
    solid.csg = solid.create()
    solid.layout = {
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
    return solid
}


module.exports = lib