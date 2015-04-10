var gulp = require('gulp')
var gutil = require('gulp-util')
// var sourcemaps = require('gulp-sourcemaps')
var source = require('vinyl-source-stream')
// var buffer = require('vinyl-buffer')
var watchify = require('watchify')
var browserify = require('browserify')
 var reactify = require('reactify')
var rename = require('gulp-rename')
var replace = require('gulp-replace')
var p = require('partialify/custom')
// var brfs = require('brfs')

var bundler = watchify(browserify('./lib/editor/index.js', watchify.args));
//bundler.require('./lib/brcraft.js')
// add any other browserify options or transforms here
bundler.transform(reactify)
// bundler.transform('brfs');
bundler.transform(p.alsoAllow('xml'))

gulp.task('js', bundle); // so you can run `gulp js` to build the file
bundler.on('update', bundle); // on any dep update, runs the bundler
bundler.on('log', gutil.log); // output build logs to terminal

function bundle() {
  return bundler.bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    // .pipe(replace(/foo(.{3})/g, '$1foo'))
    // optional, remove if you dont want sourcemaps
      // .pipe(buffer())
      // .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
      // .pipe(sourcemaps.write('./')) // writes .map file
    //
    // .pipe(rename('bundle.js'))
    .pipe(gulp.dest('./viewer/public/js'))
}

gulp.task('lib', function(){

    function doBundle(){
      return bundler.bundle()
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./viewer/public'))
    }

    var bundler = watchify(browserify('./lib/browser.js', watchify.args));
    bundler.transform(p.alsoAllow('xml'))
    bundler.on('update', doBundle) // on any dep update, runs the bundler

    return doBundle()
})