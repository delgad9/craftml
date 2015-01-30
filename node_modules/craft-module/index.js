var fs = require('fs'),
    path = require('path')

module.exports = function(parent) {

    var index_xml = path.resolve(parent.paths[0], '../index.xml')
    console.log(index_xml)
    var xml = {}
    xml.path = index_xml
    xml.contents = fs.readFileSync(xml.path, 'utf8')
    return xml
}