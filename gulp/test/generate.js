var gulp = require('gulp'),
    through2 = require('through2'),
    _ = require('lodash'),
    fs = require('fs'),
    path = require('path')

var glob = require("glob")

function spaces(n){
    return _.repeat(' ', n)
}

function indent(input, n){
    return _.map(input.split('\n'), function(line){
        return spaces(4) + line
    }).join('\n')
}

function describe(title, body){
    return 'describe("' + title + '", function(){ this.timeout(60000)\n' +

        body

        + '\n})'
}

function it(title, file){
    return 'it("' + title + '", function(){\n' +

        '    return test("' + file + '")'

        + '\n})\n'
}

function generate(p){

    var node = {}

    var files = glob.sync(p + '/*')

    // console.log(files)

    var xmlFiles = _.filter(files, function(f){
        return fs.lstatSync(f).isFile()
    })

    var its = _.map(xmlFiles, function(xmlFile){
        var title = path.basename(xmlFile)
        return it(title, xmlFile)
    }).join('\n')

    its = indent(its)

    var cps = _.filter(files, function(f){
        return fs.lstatSync(f).isDirectory()
    })

    var descs = _.map(cps, _.partialRight(generate))
        .join('\n')

    var title = path.basename(p)
    var body = indent('\n\n' + its + descs + '\n')
    var text = describe(title, body)

    return text
}

gulp.task('test:generate', function () {

    // glob all the xml files in examples

    var root = 'examples'

    var requires = 'var test = require("./test")\n'

    var tests = generate(root)

    var all = requires + '\n\n' + tests
    // console.log(all)

    fs.writeFile('test/examples.test.js', all)

    // generate a Mocha test suite

})
