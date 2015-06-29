var fs = require('fs')
if (fs.readFileSync) {
// fs is available on server-side
    require = function(src) {
        return fs.readFileSync(__dirname + '/' + src, 'utf8')
    }
} // otherwise, browserify & partialify will take care of 'require'

module.exports = {
    group: require('./group.xml'),
    g: require('./group.xml'),
    solidify: require('./solidify.xml')
}
