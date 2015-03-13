var Promise = require("bluebird"),
    path = require('path'),
    url = require('url')

var fs = Promise.promisifyAll(require('fs')),
    request = Promise.promisifyAll(require("request"))

module.exports = {
    src: loadSrc,
    module: loadModule
}

function _searchForModulePath(currentPath, name) {
    var modulePath = path.join(currentPath, 'node_modules', name)
    if (fs.existsSync(modulePath)) {

        return modulePath

    } else {

        if (currentPath === '/') {
            return undefined
        } else {
            return _searchForModulePath(path.join(currentPath, '../'), name)
        }
    }
}

function _doCORSRequest(options, cb) {
    var cors_api_host = 'cors-anywhere.herokuapp.com';
    var cors_api_url = 'https://' + cors_api_host + '/';
    var x = new XMLHttpRequest();
    x.open(options.method, cors_api_url + options.url);
    // x.overrideMimeType("text/plain; charset=x-user-defined")
    x.onload = x.onerror = function() {
        // var blob = new Blob([x.response])
        if (x.response) {
            cb(null, x.response)
        } else {
            cb(x)
        }
    }
    if (/^POST/i.test(options.method)) {
        x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
    x.send(options.data);
}

function _getContentsPromise(url) {

    if (!global.window) {
        return request
            .getAsync(url)
            .spread(function(response, body) {

                return body

            })

    } else {

        // load an stl using CORS anywhere workaround
        return new Promise(function(resolve, reject) {

            _doCORSRequest({
                method: 'get',
                url: url
            }, function(error, response) {
                if (error)
                    reject(error)
                else
                    resolve(response)
            })

        })
    }
}

function loadModule(context, moduleId) {

    var toks = moduleId.split('/')
    if (toks.length == 2) {
        // github
        // sikuli/craft-pin

        var scope = toks[0]
        var id = toks[1]
        var url = 'https://raw.githubusercontent.com/' + scope + '/' + id + '/master/index.xml'
        console.log('importing module %s from %s', moduleId, url)

        return _getContentsPromise(url)        
            .then(function(contents) {
                return {
                    contents: contents,
                    context: context,
                    path: url
                }
            })

    } else {


        var modulePath = _searchForModulePath(context.basePath, moduleId)
        if (modulePath) {

            context.basePath = modulePath
            var indexXml = path.join(modulePath, 'index.xml')

            return fs.readFileAsync(indexXml, 'utf8')
                .then(function(contents) {

                    return {
                        contents: contents,
                        context: context,
                        path: modulePath
                    }
                })
        }
    }
}

function loadSrc(context, src) {

    var abspath
    if (src.match(/^http/)) {
        abspath = src
    } else if (context.basePath.match(/^http/)) {
        abspath = url.resolve(context.basePath, src)
    } else {
        abspath = path.resolve(context.basePath, src)
    }

    // var readPromise
    if (abspath.match(/^http/)) {
        readPromise = request.getAsync(abspath).spread(function(response, body) {
            return body
        })
        context.basePath = abspath
    } else {
        readPromise = fs.readFileAsync(abspath, 'utf8')
        context.basePath = path.dirname(abspath)
    }


    return readPromise
        .then(function(contents) {
            return {
                contents: contents,
                context: context,
                path: abspath
            }
        })
}