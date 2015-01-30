module.exports = CraftRef

var Block = require('./block')

function CraftRef(ref) {
	this.contents = []
    this.ref = ref
    this.type = 'CraftRef'
}

CraftRef.prototype = new Block()
CraftRef.prototype.constructor = CraftRef