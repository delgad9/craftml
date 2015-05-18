var fs = require('fs')
if (fs.readFileSync) {
// fs is available on server-side
    require = function(src) {
        return fs.readFileSync(__dirname + '/' + src, 'utf8')
    }
} // otherwise, browserify & partialify will take care of 'require'

var layouts = {}
layouts['diagonal-layout'] = require('./diagonal-layout.xml')
layouts['circle-layout'] = require('./circle-layout.xml')
layouts['wave-layout'] = require('./wave-layout.xml')
module.exports = layouts
