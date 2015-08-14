import $$$ from '../scad'
import Solid from '../solid'
import _ from 'lodash'

// hard-coded parameters per official Braille dimensions
const dotDistance = 2.5   // between two dot centers
const charSpacing = 2.3   // spacing between two consecutive chars (6-2.5-1.2)

export default function render_braille($scope){

    let rawText = this.src.children[0].data

    let text = '' + $scope.resolve(rawText) || ''
    
    text = text.toUpperCase().trim()

    let charSolids = _.map(text, char => {
        let s = render_character(char)
        if (s){
            _.forEach(s.children, c => {
                c.style = this.src.style
            })
        }
        return s
    })
    charSolids = _.compact(charSolids)

    let phraseSolid = Solid.fromGroup(charSolids)
    phraseSolid.layoutEval('lineupX(' + charSpacing + ')')
    phraseSolid.fitToChildren()
    phraseSolid.role = 'group'
    phraseSolid.name = 'phrase'

    this.add(phraseSolid)

    phraseSolid.applyStyleRecursively($scope.css)
}


var dotcsg = _.memoize(() => {
    let c = new $$$.CSG.sphere({radius: 0.5,
            resolution: 15,
            center:[0.5,0.5,0]})
    c = c.subtract($$$.cube([1,1,0.5])
            .translate([0,0,-0.5]))
            .scale([1.2,1.2,1])
            .union($$$.cube([1.2,1.2,0.1]).translate([0,0,-0.05]))
    return c
})

var dotcsg1 = _.memoize(() => {
    let c = new $$$.CSG.cube()
    return c
})

var spacecsg = _.memoize(()=>{
    return $$$.cube([1.2, 1.2, 0.5])
})

function render_character(char){

    // let dotcsg = getDotCSG()
    // let spacecsg = getSpaceCSG()

    let bs = bitmap(char)
    if (bs){
        let parts = []
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                let loc = i * 2 + j
                let b = bs[loc]
                let dx = j*dotDistance
                let dy = i*dotDistance
                if (b) {
                    let dot = new Solid(dotcsg())
                    dot.name = 'dot'
                    dot.translate(dx,dy,0)
                    parts.push(dot)
                } else {
                    let space = new Solid(spacecsg())
                    space.name = 'space'
                    space.translate(dx,dy,0)
                    delete space.csg
                    parts.push(space)
                }
            }
        }
        let s = Solid.fromGroup(parts)
        s.name = 'letter'
        s.fitToChildren()
        return s
    }
}

function bitmap(char) {

    let letter = (x) => {return x}

    if (char == "A") {
        return letter([
            1, 0,
            0, 0,
            0, 0
        ]);
    } else if (char == "B") {
        return letter([
            1, 0,
            1, 0,
            0, 0
        ]);
    } else if (char == "C") {
        return letter([
            1, 1,
            0, 0,
            0, 0
        ]);
    } else if (char == "D") {
        return letter([
            1, 1,
            0, 1,
            0, 0
        ]);
    } else if (char == "E") {
        return letter([
            1, 0,
            0, 1,
            0, 0
        ]);
    } else if (char == "F") {
        return letter([
            1, 1,
            1, 0,
            0, 0
        ]);
    } else if (char == "G") {
        return letter([
            1, 1,
            1, 1,
            0, 0
        ]);
    } else if (char == "H") {
        return letter([
            1, 0,
            1, 1,
            0, 0
        ]);
    } else if (char == "I") {
        return letter([
            0, 1,
            1, 0,
            0, 0
        ]);
    } else if (char == "J") {
        return letter([
            0, 1,
            1, 1,
            0, 0
        ]);
    } else if (char == "K") {
        return letter([
            1, 0,
            0, 0,
            1, 0
        ]);
    } else if (char == "L") {
        return letter([
            1, 0,
            1, 0,
            1, 0
        ]);
    } else if (char == "M") {
        return letter([
            1, 1,
            0, 0,
            1, 0
        ]);
    } else if (char == "N") {
        return letter([
            1, 1,
            0, 1,
            1, 0
        ]);
    } else if (char == "O") {
        return letter([
            1, 0,
            0, 1,
            1, 0
        ]);
    } else if (char == "P") {
        return letter([
            1, 1,
            1, 0,
            1, 0
        ]);
    } else if (char == "Q") {
        return letter([
            1, 1,
            1, 1,
            1, 0
        ]);
    } else if (char == "R") {
        return letter([
            1, 0,
            1, 1,
            1, 0
        ]);
    } else if (char == "S") {
        return letter([
            0, 1,
            1, 0,
            1, 0
        ]);
    } else if (char == "T") {
        return letter([
            0, 1,
            1, 1,
            1, 0
        ]);
    } else if (char == "U") {
        return letter([
            1, 0,
            0, 0,
            1, 1
        ]);
    } else if (char == "V") {
        return letter([
            1, 0,
            1, 0,
            1, 1
        ]);
    } else if (char == "W") {
        return letter([
            0, 1,
            1, 1,
            0, 1
        ]);
    } else if (char == "X") {
        return letter([
            1, 1,
            0, 0,
            1, 1
        ]);
    } else if (char == "Y") {
        return letter([
            1, 1,
            0, 1,
            1, 1
        ]);
    } else if (char == "Z") {
        return letter([
            1, 0,
            0, 1,
            1, 1
        ]);
    } else if (char == "CH") {
        return letter([
            1, 0,
            0, 0,
            0, 1
        ]);
    } else if (char == "SH") {
        return letter([
            1, 1,
            0, 0,
            0, 1
        ]);
    } else if (char == "TH") {
        return letter([
            1, 1,
            0, 1,
            0, 1
        ]);
    } else if (char == "WH") {
        return letter([
            1, 0,
            0, 1,
            0, 1
        ]);
    } else if (char == "OU") {
        return letter([
            1, 0,
            1, 1,
            0, 1
        ]);
    } else if (char == "ST") {
        return letter([
            0, 1,
            0, 0,
            1, 0
        ]);
    } else if (char == "AND") {
        return letter([
            1, 1,
            1, 0,
            1, 1
        ]);
    } else if (char == "FOR") {
        return letter([
            1, 1,
            1, 1,
            1, 1
        ]);
    } else if (char == "OF") {
        return letter([
            1, 0,
            1, 1,
            1, 1
        ]);
    } else if (char == "THE") {
        return letter([
            0, 1,
            1, 0,
            1, 1
        ]);
    } else if (char == "WITH") {
        return letter([
            0, 1,
            1, 1,
            1, 1
        ]);
    } else if (char == "IN") {
        return letter([
            0, 0,
            0, 1,
            1, 0
        ]);
    } else if (char == "EN") {
        return letter([
            0, 0,
            1, 0,
            0, 1
        ]);
    } else if (char == "CON") {
        return letter([
            0, 0,
            1, 1,
            0, 0
        ]);
    } else if (char == "DIS") {
        return letter([
            0, 0,
            1, 1,
            0, 1
        ]);
    } else if (char == "COM") {
        return letter([
            0, 0,
            0, 0,
            1, 1
        ]);
    } else if (char == "BE") {
        return letter([
            0, 0,
            1, 0,
            1, 0
        ]);
    } else if (char == "EA") {
        return letter([
            0, 0,
            1, 0,
            0, 0
        ]);
    } else if (char == "BB") {
        return letter([
            0, 0,
            1, 0,
            1, 0
        ]);
    } else if (char == "CC") {
        return letter([
            0, 0,
            1, 1,
            0, 0
        ]);
    } else if (char == "DD") {
        return letter([
            0, 0,
            1, 1,
            0, 1
        ]);
    } else if (char == "FF") {
        return letter([
            0, 0,
            1, 1,
            1, 0
        ]);
    } else if (char == "GG") {
        return letter([
            0, 0,
            1, 1,
            1, 1
        ]);
    } else if (char == "AR") {
        return letter([
            0, 1,
            0, 1,
            1, 0
        ]);
    } else if (char == "BLE") {
        return letter([
            0, 1,
            0, 1,
            1, 1
        ]);
    } else if (char == "ED") {
        return letter([
            1, 1,
            1, 0,
            0, 1
        ]);
    } else if (char == "ER") {
        return letter([
            1, 1,
            1, 1,
            0, 1
        ]);
    } else if (char == "GH") {
        return letter([
            1, 0,
            1, 0,
            0, 1
        ]);
    } else if (char == "ING") {
        return letter([
            0, 1,
            0, 0,
            1, 1
        ]);
    } else if (char == "OW") {
        return letter([
            0, 1,
            1, 0,
            0, 1
        ]);
    } else if (char == "cap") {
        return letter([
            0, 0,
            0, 0,
            0, 1
        ]);
    } else if (char == "#") {
        return letter([
            0, 1,
            0, 1,
            1, 1
        ]);
    } else if (char == "let") {
        return letter([
            0, 0,
            0, 1,
            0, 1
        ]);
    } else if (char == ".") {
        return letter([
            0, 0,
            1, 1,
            0, 1
        ]);
    } else if (char == "?") {
        return letter([
            0, 0,
            1, 0,
            1, 1
        ]);
    } else if (char == "!") {
        return letter([
            0, 0,
            1, 1,
            1, 0
        ]);
    } else if (char == "-") {
        return letter([
            0, 0,
            0, 0,
            1, 1
        ]);
    } else if (char == "quote") {
        return letter([
            0, 0,
            0, 1,
            1, 1
        ]);
    } else if (char == "1") {
        return letter([
            1, 0,
            0, 0,
            0, 0
        ]);
    } else if (char == "2") {
        return letter([
            1, 0,
            1, 0,
            0, 0
        ]);
    } else if (char == "3") {
        return letter([
            1, 1,
            0, 0,
            0, 0
        ]);
    } else if (char == "4") {
        return letter([
            1, 1,
            0, 1,
            0, 0
        ]);
    } else if (char == "5") {
        return letter([
            1, 0,
            0, 1,
            0, 0
        ]);
    } else if (char == "6") {
        return letter([
            1, 1,
            1, 0,
            0, 0
        ]);
    } else if (char == "7") {
        return letter([
            1, 1,
            1, 1,
            0, 0
        ]);
    } else if (char == "8") {
        return letter([
            1, 0,
            1, 1,
            0, 0
        ]);
    } else if (char == "9") {
        return letter([
            0, 1,
            1, 0,
            0, 0
        ]);
    } else if (char == "0") {
        return letter([
            0, 1,
            1, 1,
            0, 0
        ]);
    } else if (char == " ") {
        return letter([
            0, 0,
            0, 0,
            0, 0
        ]);
    } else {
        // console.log("Invalid Character: ", char);
    }

}
