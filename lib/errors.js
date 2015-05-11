var errors = require('errors')
errors.create({name: 'RuntimeError'});
errors.create({
    name: 'ModuleNotFoundError',
    defaultMessage: 'The requested file could not be found'
    })
module.exports = errors
