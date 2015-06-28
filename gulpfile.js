var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    through2 = require('through2')

//gulpfile.js
var babel = require("gulp-babel")
gulp.task("babel", ["others"], function () {
  return gulp.src(["./lib/**/*.js"])
    .pipe(babel({ignore:'fixTJunctions.js'}))
    .pipe(gulp.dest("dist"))
})

gulp.task("others", function () {
    return gulp.src(["./lib/**/*.xml","./lib/**/*.json"])
      .pipe(gulp.dest("dist"))
})

gulp.task("watch", function(){
    gulp.watch('lib/**/*.js', ['default'])
})

var babelregister = require('babel/register');
gulp.task('test:examples', function() {
    return gulp.src('test/build.test.js', {
            read: false
        })
        // gulp-mocha needs filepaths so you can't have any plugins before it
        .pipe(mocha({compilers: {js: babelregister}}))
});

var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs'))

function buildStlAsync(path) {
    var  craft = require('./dist/craft')
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

gulp.task('test:examples:build', ['babel'], function() {



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
