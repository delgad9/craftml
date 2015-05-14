module.exports = function(CAG) {

    CAG.Vertex = function(pos) {
        this.pos = pos;
    };

    CAG.Vertex.prototype = {
        toString: function() {
            return "(" + this.pos.x.toFixed(2) + "," + this.pos.y.toFixed(2) + ")";
        },
        getTag: function() {
            var result = this.tag;
            if (!result) {
                result = CSG.getTag();
                this.tag = result;
            }
            return result;
        }
    };
}
