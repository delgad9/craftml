export default class Size{

    constructor() {
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
}
