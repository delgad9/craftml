var Promise = require('bluebird')
var cw = require('catiline')
var worker = cw({
    first: function(a, callback) {
        console.log('worker: initialized')
        return callback(true)
    },
    preview: function(input, callback) {
        // TODO: allow import from a relative path

        importScripts('/js/craftml.js')
        craftml
                .preview(input.code, input.context)
                .then(function(previewable) {
                    console.log('worker: preview', previewable)
                    callback(previewable)
                }).catch(function(err) {
                    console.log('error',err.stack)
                    callback('')
                })
    },

    craft: function(input, callback) {
        // TODO: allow import from a relative path

        console.log('worker crafting')
        return callback({})
            // if (input.mode === 'export') {
            //     craft.build(input.code, input.context)
            //         .then(function(r) {
            //             console.log('worker build done', r)
            //             var result = r.toStlString()
            //             callback(result)
            //         })
            // } else {
            //     craft
            //         .preview(input.code, input.context)
            //         .then(function(previewable) {
            //             console.log('worker:preview', previewable)
            //             // console.log('worker preview done', solids)
            //             // var csgs = _s(solids).csgs()
            //             // var result = {}
            //             // result.csgs = csgs.map(function(csg) {
            //             //     return {
            //             //         stl: csg.toStlString()
            //             //     }
            //             // })
            //             // if (solids.length > 0){
            //             //     var s = solids[0]
            //             //     result.layout = s.layout
            //             // }
            //             callback(previewable)
            //         }).catch(function(err) {
            //             console.log('error',err.stack)
            //             callback('')
            //         })
            // }
    }
})

function brcraft() {
    this.init()
}

brcraft.prototype.init = function() {
    return worker.first('')
}

brcraft.prototype.preview = function(code, context) {

    // if (!options.useWorker) {
    //
    //     return craft
    //         .preview(code, context)
    //         .then(function(solids) {
    //             // console.log('worker preview done', solids)
    //                 var csgs = _s(solids).csgs()
    //                 var result = {}
    //                 result.csgs = csgs.map(function(csg) {
    //                     return {
    //                         stl: csg.toStlString()
    //                     }
    //                 })
    //                 var s = solids[0]
    //                 result.layout = s.layout
    //             return result
    //         })
    //
    // } else {
    return new Promise(function(resolve, reject) {
            console.log('worker: preview')
            worker
                .preview({
                    code: code,
                    // mode: 'preview',
                    context: context
                })
                .then(function(previewable) {
                    console.log('previewable', previewable)
                        //  turn it into a Bluebird promise
                    resolve(previewable)
                })
        })
        // }
}

brcraft.prototype.build = function(code, context, options) {

    if (!options.useWorker) {

        return craft.build(code, context)
            .then(function(r) {
                console.log('worker build done', r)

                var result = r.toStlString()
                return result
            })

    } else {
        return worker
            .craft({
                code: code,
                mode: 'export',
                context: context
            })
    }
}

module.exports = new brcraft()
