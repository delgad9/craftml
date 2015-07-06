import _ from 'lodash'

let pattern = /\s*((translate|translateTo|rotate|tighten|scale|center|mirror|crop|apply|set|land)[XYZ]*)\(.*?\)\s*/g

function _parse(code){

    let exprs = code.match(pattern)
    return _.map(exprs, function(expr){
        var m = expr.match(/(.+)\((.*)\)/)
        return {name: m[1].trim(),
                args: _.compact(m[2].trim().split(/[,\s]+/))
            }
        })
}

export default function transformEval(code) {

    // code does not allow {{ }}. iterpolation must be done by caller first
    // i.e., scope.resolve(...)

    var ops = _parse(code)

    _.forEach(ops, op => {

        var numbers = op.args.map( d => Number(d))

        var f = this[op.name]
        if (f)
            f.apply(this, numbers)
    })
}
