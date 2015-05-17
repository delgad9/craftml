//////////////////////////////////////
// Tag factory: we can request a unique tag through CSG.getTag()
var staticTag = 1;

function getTag() {
	return staticTag++;
}

module.exports = getTag
