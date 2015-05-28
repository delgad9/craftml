var fs = require('fs')
if (fs.readFileSync) {
// fs is available on server-side
    require = function(src) {
        return fs.readFileSync(__dirname + '/' + src, 'utf8')
    }
} // otherwise, browserify & partialify will take care of 'require'

module.exports = {
    group: require('./group.xml'),
    lineup: require('./lineup.xml'),
    scale: require('./scale.xml'),
    align: require('./align.xml'),
    repeat: require('./repeat.xml'),
    rotate: require('./rotate.xml'),
    translate: require('./translate.xml'),
    crop: require('./crop.xml'),
    resize: require('./resize.xml'),
    solidify: require('./solidify.xml')
}
