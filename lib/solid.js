var _ = require('lodash'),
    $$$ = require('craft-scad')

module.exports = Solid

function Solid() {
    this.children = []
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
    this.csg
}

Solid.prototype.toStl = toStl
Solid.prototype.toStls = toStls

function toStl() {
    var csgs = []
    collect_csgs(this, csgs)
    return $$$.union(csgs).toStlString()
}

function toStls() {
    var csgs = []
    collect_csgs(this, csgs)
    return csgs.map(function(csg) {
        return csg.toStlString()
    })
}

function collect_csgs(solid, acc) {
    if (solid.csg) {
        return acc.push(solid.csg)
    } else {
        return solid.children.forEach(function(s) {
            return collect_csgs(s, acc)
        })
    }
}