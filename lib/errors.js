var errors = require('errors')
errors.create({name: 'RuntimeError'});
errors.create({
    name: 'ModuleNotFoundError',
    defaultMessage: 'The requested file could not be found'
    })
errors.create({
    name: 'RenderError',
    defaultMessage: 'An error has been encountered while rendering'
    })
module.exports = errors
