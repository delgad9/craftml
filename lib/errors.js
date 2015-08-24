var StandardError = require("standard-error")

class RenderError extends StandardError {

}

class ScriptError extends StandardError {

}

var errors = {
    RenderError: RenderError,
    ScriptError: ScriptError
}

module.exports = errors
// var errors = require('errors')
// errors.create({name: 'RuntimeError'});
// errors.create({
//     name: 'ModuleNotFoundError',
//     defaultMessage: 'The requested file could not be found'
//     })
// errors.create({
//     name: 'RenderError',
//     defaultMessage: 'An error has been encountered while rendering'
//     })
// errors.create({
//     name: 'ScriptError',
//     defaultMessage: 'An error has been encountered while evaluating a script'
//     })
// module.exports = errors
