var Promise = require("bluebird"),
    path = require('path'),
    url = require('url'),
    _ = require('lodash')

var fs = Promise.promisifyAll(require('fs')),
    request = Promise.promisifyAll(require("request"))

var errors = require('./errors')

module.exports = {
    src: loadSrc,
    module: loadModule
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
    x.onload = x.onerror = function(d) {
        // console.log(x.status, x.response)
        if (x.status === 200) {
            cb(null, x.response)
        } else {
            cb(x.status)
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
        // console.log('loading from ', srcUrl)
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

function _loadFromGithubRepoAsync(context, repo){

    var basePath = 'https://raw.githubusercontent.com/' + repo + '/master/'
    var url = basePath + 'index.xml'

    return _getContentsPromise(context, url)
        .then(function(contents) {

            context.basePath = basePath
            return {
                contents: contents,
                context: context,
                path: url
            }
        })
}

function _loadFromCraftMLAsync(context, sid){
    var url = 'http://craftml.io/raw/' + sid
    context.origin = 'craftml.io'
    return _getContentsPromise(context, url)
        .then(function(contents) {

            context.basePath = 'http://craftml.io/raw/' + sid + '/'
            return {
                contents: contents,
                context: context,
                path: url
            }
        })
}


function _searchForModulePathLocally(currentPath, name) {

    // if it's within a browser context
    if (typeof XMLHttpRequest !== 'undefined')
        // no result
        return undefined

    var modulePath = path.join(currentPath, 'node_modules', name)
    if (fs.existsSync(modulePath)) {
        return modulePath
    } else {

        if (currentPath === '/') {
            return undefined
        } else {
            return _searchForModulePathLocally(path.join(currentPath, '../'), name)
        }
    }
}


function loadModule(context, moduleId) {

    console.log('loading module %s', moduleId)

    var toks = moduleId.split('/')
    if (toks[0].match(/^@gist/)){

        var m = moduleId.match(/^@gist\/(.*)/)
        var gist = m[1]

        var basePath = 'https://gist.githubusercontent.com/' + gist + '/raw/'
        var url = basePath + 'index.xml'
        console.log('importing from %s', url)

        return _getContentsPromise(context, url)
            .then(function(contents) {

                context.basePath = basePath
                return {
                    contents: contents,
                    context: context,
                    path: url
                }
            })


    } else if (toks.length == 1 && toks[0].match(/[A-Z]/)) {
        // moduleId = YdcsCs1
        //console.log('short id from %s', moduleId)
        return _loadFromCraftMLAsync(context, moduleId)

    } else if (toks.length == 2) {
        // github
        // sikuli/craft-pin
        var repo = moduleId
        return _loadFromGithubRepoAsync(context, repo)

    } else {

        var modulePath = _searchForModulePathLocally(context.basePath, moduleId)
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
        else {

            var url = 'http://registry.npmjs.org/' + moduleId + '/latest'
            return _getContentsPromise(context, url)
                .then(function(contents){
                    var r = JSON.parse(contents)
                    var repourl = r.repository.url
                    var m = repourl.match(/https:\/\/github\.com\/(.*)\.git/)
                    if (m){
                        var repo = m[1]
                        return _loadFromGithubRepoAsync(context, repo)
                    }
                })
                .catch(function(err){
                    throw new errors.ModuleNotFoundError(moduleId)
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
