module.exports = Craft

var Solid = require('./solid')

function Craft() {
    this.contents = []
}

Craft.prototype.render = function() {

    var solids = this.contents.map(function(block) {
        return block.render()
    })

    var solid = new Solid()
    solid.children = solids
    solid.fitToChildren()
    return solid
}