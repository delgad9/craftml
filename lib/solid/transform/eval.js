import _ from 'lodash'

let valid = /(translate|translateTo|rotate|tighten|scale|scaleTo|fit|center|centerAt|mirror|crop|apply|set|land|resize|size|position|ungroup)[XYZ]*/
let pat =  /\s*(([a-zA-Z]+)[XYZ]*)\(.*?\)\s*/g

function _parse(code){

    let exprs = code.match(pat)

    return _.map(exprs, expr =>{
        let m = expr.match(/(.+)\((.*)\)/)
        return {
                name: m[1].trim(),
                args: _.compact(m[2].trim().split(/[,\s]+/))
            }
        })
}

export default function transformEval(code) {

    // code does not allow {{ }}. iterpolation must be done by caller first
    // i.e., scope.resolve(...)

    var ops = _parse(code)
    _.forEach(ops, op => {

        //
        let args = op.args.map( d => {

            // percentage
            // matches 1.23%, -1.23%  3%
            let m = d.match(/(^-?[\d\.]+)%$/)
            if (m){
                return {
                    type: 'percentage',
                    value: Number(m[1])
                }
            } else {
                return Number(d)
            }

        })

        let name = op.name

        // aliases
        // size -> resize
        name = name.replace(/^(size.*)/, 're$1')

        // position -> translateTo
        name = name.replace(/^position$/, 'translateTo')

        // positionX -> setX
        name = name.replace(/^position(.+)$/, 'set$1')

        let f = this[name]
        if (f && name.match(valid)){

            f.apply(this, args)

        } else {

            throw `"${name}" is not a valid transform command`
        }

    })
}
