module.exports = Craft

var Solid = require('./solid')

function Craft() {
    this.contents = []
}

Craft.prototype.doLayout = rowLayout

Craft.prototype.render = function() {

	// render all contents nodes to solids
    var solids = this.contents.map(function(block) {
        return block.render()
    })

    // layout these solids
    this.doLayout(solids)

    // create a parent Solid to group these solids under
    var solid = new Solid()
    solid.children = solids
    solid.fitToChildren()
    return solid
}

function rowLayout(solids){
    var tx = 0
    solids.forEach(function(solid) {
        solid.layout.x = tx
        tx = tx + solid.layout.width
    })    
}

function stackLayout(solids){
    var tz = 0
    solids.forEach(function(solid) {
        solid.layout.z = tz
        tz = tz + solid.layout.depth
    })    
}
