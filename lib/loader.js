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
    // console.debug('[craftml] download from ', get_url)

    var x = new XMLHttpRequest();
    x.open(options.method, get_url);
    x.setRequestHeader("Accept", "text/xml; charset=x-user-defined")
    x.overrideMimeType("text/plain; charset=x-user-defined")
    // x.overrideMimeType("text/xml; charset=x-user-defined")
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

export function lazy(moduleId, context){

    let url = resolve(moduleId, context)

    return {

        path: url,
//
        get() {

            console.log(`loading module ${moduleId}  -> ${url}`)

            if (url.match(/^file:/)){

                let p = url.match(/^file:\/(.*)/)[1]

                return fs.readFileAsync(p, 'binary')
                    .then(contents => {
                        console.log(`loaded locally ${contents.length} bytes`)
                        return contents
                    })

            } else if (typeof XMLHttpRequest !== 'undefined'){

                var x = new XMLHttpRequest()
                x.open('get', url)
                x.setRequestHeader("Accept", "text/xml; charset=x-user-defined")
                x.overrideMimeType("text/plain; charset=x-user-defined")

                return new Promise((resolve, reject) => {

                    x.onload = x.onerror = function(d) {

                        if (x.status === 200) {
                            console.log(`downloaded remotely ${x.response.length} bytes`)
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
                    encoding: "binary",
                    headers: {
                        accept: 'text/xml'
                    }
                }
                return request
                    .getAsync(options)
                    .spread(function(response, body) {
                        console.log(`downloaded remotely ${body.length} bytes`)
                        return body
                    })
            }
        }
    }
}

function _getContentsPromise(context, srcUrl) {

    if (typeof XMLHttpRequest === 'undefined') {
        var options = {
            url: srcUrl,
            encoding: "binary",
            headers: {
                accept: 'text/xml'
            }
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
            // var isSameOrigin = context.origin && context.origin.match(hostname)

            // do not use CORS anywhere workaround anymore
            var isSameOrigin = true

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
    var url = 'http://craftml.io/' + sid
    context.origin = 'craftml.io'
    return _getContentsPromise(context, url)
        .then(contents =>{
            let c = {
                base: 'http://craftml.io/' + sid + '/',
                path: url,
                contents: contents
            }
            return c
        })
}

import urljoin from 'url-join'

function resolve(moduleId, context){

    // console.log(`resolve ${moduleId} w.r.t. ${JSON.stringify(_.pick(context,'base','path','cwd'))}`)

    // ./head.xml => EJTzg/head.xml
    let ms

    // if relative path
    if (ms = moduleId.match(/^\.\/(.*)/)){

        let absbase = context.base


        if (context.base.match(/^http:\/\//)){
            // context.base === http:// ...

            absbase = context.base

        } else if (context.base.match(/^file:\//)){

            absbase = context.base

        } else if (!context.base.match(/^\//)){

            // context.base !== /.....

            if (context.cwd){
                // cwd === file:///Users/path/to
                absbase = path.join(context.cwd, context.base)

            }

        }

        let resolved = urljoin(absbase, ms[1])

        return resolved

    } else {

        // abs module id
        return moduleId
    }

}

export function loadModule(moduleId, context) {

    // console.log(`resolve ${moduleId} w.r.t. ${context.path} ${context.base}`)
    let resolved = resolve(moduleId, context)
    console.log(`loading module ${moduleId}  -> ${resolved}`)
    moduleId = resolved

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

    } else if (moduleId.match(/^http:\/\/craftml.io\//)) {
        // moduleId is an url from craftml.io
        let url = moduleId
        return _getContentsPromise(context, url)
            .then(function(contents){
                let c = {
                    cwd: context.cwd,
                    path: moduleId,
                    contents: contents,
                    base: path.dirname(moduleId)
                }
                return c
            })


    } else if (moduleId.match(/^file/)) {

        // file://Users/tomyeh/dev/craftml/craftml/test/examples/models/fast/alternate-layout.xml
        let p = moduleId.match(/^file:\/(.*)/)[1]
        return fs.readFileAsync(p, 'utf8')
            .then(contents => {
                let c = {
                    cwd: context.cwd,
                    path: moduleId,
                    contents: contents,
                    base: path.dirname(moduleId)
                }
                return c
            })

    } else {

            //console.log('loading module from npm', moduleId)
            let url = `http://craftml.io/raw/module/${moduleId}`
            return _getContentsPromise(context, url)
                .then(function(contents){
                    let c = {
                        path: url,
                        contents: contents,
                        base: path.dirname(url)
                    }
                    return c
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
