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
