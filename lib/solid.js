module.exports = Solid

function Solid(csg) {
    this.type = 'solid'
    if (csg) {
        this.csg = csg
        this.layout = computeLayout(csg)
    } else {
        this.layout = {
            location: {
                x: 0,
                y: 0,
                z: 0
            },
            size: {
                x: 0,
                y: 0,
                z: 0
            }
        }
    }
}

Solid.prototype.fitToCSG = function(){
    computeLayout(this.csg)
}

function computeLayout(csg) {
    var cb = csg.getBounds()
    var layout = {}
    return {
        size: {
            x: cb[1].x - cb[0].x,
            y: cb[1].y - cb[0].y,
            z: cb[1].z - cb[0].z
        },
        location: {
            x: cb[0].x,
            y: cb[0].y,
            z: cb[0].z
        }
        // width: cb[1].x - cb[0].x,
        // height: cb[1].y - cb[0].y,
        // depth: cb[1].z - cb[0].z
    }
}