var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    through2 = require('through2')

gulp.task('test:examples', function() {
    return gulp.src('test/build.test.js', {
            read: false
        })
        // gulp-mocha needs filepaths so you can't have any plugins before it
        .pipe(mocha());
});


var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    craft = require('./lib/craft')

function buildStlAsync(path) {
    var src = path + '/index.xml'
    return fs.readFileAsync(src, 'utf8')
        .then(function(code) {
            var options = {
                basePath: path
            }
            return craft.build(code, options)
        })
        .then(function(r) {
            return r.toStlString()
        })
}

gulp.task('test:examples:build', function() {
            return gulp.src('test/examples/*', {
                    read: false
                })
                .pipe(through2.obj(function(file, enc, callback) {

                        buildStlAsync(file.path)
                            .then(function(stl){
                                    var dest = file.path + '/output.test.stl'
                                    console.log('writing to ', dest)
                                    return fs.writeFileAsync(dest, stl)
                                })
                            .then(function(){
                                callback()
                            })
                    }))
        })
