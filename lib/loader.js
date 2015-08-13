import Promise from 'bluebird'
import path from 'path'
import url from 'url'
import _ from 'lodash'

let fs = Promise.promisifyAll(require('fs'))
let request = Promise.promisifyAll(require("request"))

import errors from './errors'

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

export function get(url, context){

    return function() {

        if (url.match(/^file:/)){

            let p = url.match(/^file:\/(.*)/)[1]

            return fs.readFileAsync(p, 'binary')
                .then(contents => {
                    console.log('loaded locally (bytes)', contents.length)
                    return contents
                })

        } else if (typeof XMLHttpRequest !== 'undefined'){

            var x = new XMLHttpRequest()
            x.open('get', url)
            x.overrideMimeType("text/plain; charset=x-user-defined")

            return new Promise((resolve, reject) => {

                x.onload = x.onerror = function(d) {

                    if (x.status === 200) {
                        resolve(x.response)
                    } else {
                        reject(x.status)
                    }
                }
                x.send()
            })

        } else {

            let options = {
                url: url,
                encoding: "binary"
            }
            return request
                .getAsync(options)
                .spread(function(response, body) {
                    console.log('downloaded (bytes)', body.length)
                    return body
                })
        }


    }
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

// import path from 'path'
import urljoin from 'url-join'

export function loadModule(moduleId, context) {

    // ./head.xml => EJTzg/head.xml
    let ms

    if (ms = moduleId.match(/^\.\/(.*)/)){
        let resolved = urljoin(context.basePath, ms[1])
        console.log(`loading module ${moduleId}  -> ${resolved}`)
        moduleId = resolved
    } else {
        console.log(`loading module ${moduleId}`)
    }

    let toks = moduleId.split('/')
    if (toks[0].match(/^@gist/)){

        let m = moduleId.match(/^@gist\/(.*)/)
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

    } else if (toks.length == 2 && toks[0].match(/[A-Z]/)) {
        // moduleId = YdcsCs1/head.xml
        return _loadFromCraftMLAsync(context, moduleId)

    } else if (toks.length == 2) {
        // github
        // sikuli/craft-pin
        var repo = moduleId
        return _loadFromGithubRepoAsync(context, repo)

    } else if (moduleId.match(/^http:\/\/craftml.io\/raw/)) {
        // moduleId is an url from craftml.io
        let url = moduleId
        return _getContentsPromise(context, url)
            .then(function(contents){
                //console.log(contents)
                return {
                    contents: contents,
                    context: context
                }
            })


    } else if (moduleId.match(/^file/)) {

        // file://Users/tomyeh/dev/craftml/craftml/test/examples/models/fast/alternate-layout.xml

        let p = moduleId.match(/^file:\/(.*)/)[1]

        return fs.readFileAsync(p, 'utf8')
            .then(contents => {
                return {
                    contents: contents,
                    context: context
                }
            })


    } else {

            //console.log('loading module from npm', moduleId)
            let url = `http://craftml.io/raw/module/${moduleId}`

            // var url = context.basePath + '/' + moduleId
            // var url = moduleId

            return _getContentsPromise(context, url)
                .then(function(contents){
                    return {
                        src: url,
                        contents: contents,
                        context: context
                    }
                })
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
