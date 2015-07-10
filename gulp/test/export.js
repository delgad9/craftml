var gulp = require('gulp'),
    through2 = require('through2'),
    _ = require('lodash')

var stl2image = require('stl2image')

gulp.task('test:export', function() {
    return gulp.src('test/output/**/*.stl', {
            read: false
        })
        .pipe(through2.obj(function(f,enc,cb){
            // console.log(f.path)
            exportStlToImages(f.path)
            cb()
        }))
        // gulp-mocha needs filepaths so you can't have any plugins before it
        // .pipe(mocha({compilers: {js: babelregister}}))
})


function exportStlToImages(src){

    var cameras = _.map(['x','y','z'], function(dim){
        var location = {
            x: 0,
            y: 0,
            z: 0
        }
        location[dim] = 50
        return {
            name: dim,
            location: location
        }
    })

    cameras.push({
        name: 'normal',
        location: {
            x: 10,
            y: 10,
            z: 50
        }
    })

    cameras.push({
        name: 'far',
        location: {
            x: 10,
            y: 10,
            z: 200
        }
    })

    _.forEach(cameras, function(camera){

        var extras = {}

        extras.camera = camera

        var png = src + '-' + camera.name + '.png'

        stl2image.imageify(src,
            { width: 500, height: 500, dst: png, extras: extras},
            function(err, output, name){
                // console.log(err, output, name)
            })

    })


}
