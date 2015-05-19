var fs = require('fs')
if (fs.readFileSync) {
// fs is available on server-side
    require = function(src) {
        return fs.readFileSync(__dirname + '/' + src, 'utf8')
    }
} // otherwise, browserify & partialify will take care of 'require'
module.exports = {
    cube: require('./cube.xml'),
    sphere: require('./sphere.xml'),
    cylinder: require('./cylinder.xml'),
    row: require('./row.xml'),
    column: require('./column.xml'),
    stack: require('./stack.xml'),
    text: require('./text.xml'),
    space: require('./space.xml'),
    dome: require('./dome.xml'),
    prism: require('./prism.xml'),
    braille: require('./braille.xml')
}
