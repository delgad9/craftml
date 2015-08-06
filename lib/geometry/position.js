import _ from 'lodash'

export default class Position {

    constructor(args) {

        if (arguments.length === 3){
            this.x = arguments[0]
            this.y = arguments[1]
            this.z = arguments[2]
        } else {
            this.x = 0
            this.y = 0
            this.z = 0
        }

    }

    toString() {

        return '(' + this.x + ',' + this.y + ',' + this.z + ')'

    }

    static from(args) {

        var loc
        if (args.length >= 3){
            loc = new Position(args[0], args[1], args[2])
        } else if (args.length === 1){
            var o = args[0]
            if (_.isObject(o)){
                loc = new Position(o.x, o.y, o.z)
            } else {
                loc = new Position(o, o, o)
            }
        } else {
            loc = new Position(0,0,0)
        }
        return loc

    }
}
