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

function _doXMLHttpRequest(options, cb) {    
    var cors_api_host = 'cors-anywhere.herokuapp.com';
    var cors_api_url
    if (options.cors){
        cors_api_url = 'https://' + cors_api_host + '/';
    } else {
        cors_api_url = ''
    }
    var get_url = cors_api_url + options.url
    console.debug('[craftml] download from ', get_url)

    var x = new XMLHttpRequest();
    x.open(options.method, get_url);
    x.overrideMimeType("text/plain; charset=x-user-defined")
    x.onload = x.onerror = function() {
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

function _getContentsPromise(context, srcUrl) {

    if (typeof XMLHttpRequest === 'undefined') {
        var options = {
            url: srcUrl,        
            encoding: "binary"
        }
        return request
            .getAsync(options)
            .spread(function(response, body) {

                return body

            })

    } else {

        // load an stl using CORS anywhere workaround
        return new Promise(function(resolve, reject) {

            var hostname = url.parse(srcUrl).hostname            
            var isSameOrigin = context.origin && context.origin.match(hostname)
            
            _doXMLHttpRequest({
                method: 'get',
                url: srcUrl,
                cors: !isSameOrigin
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

        return _getContentsPromise(context, url)        
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

function loadSrc(context, src, type) {
    type = type || 'utf8'

    var abspath
    if (src.match(/^http/)) {
        abspath = src
    } else if (context.basePath.match(/^http/)) {        
        abspath = url.resolve(context.basePath, src)
    } else {
        abspath = path.resolve(context.basePath, src)
    }

    var readPromise
    if (abspath.match(/^http/)) {
        readPromise = _getContentsPromise(context, abspath)
        context.basePath = abspath
    } else {
        readPromise = fs.readFileAsync(abspath, type)
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