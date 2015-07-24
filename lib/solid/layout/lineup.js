import _ from 'lodash'
export default function lineup(solids, dim, spacing, direction){

    var iter
    if (direction == '-'){
        iter = _.forEachRight
    } else {
        iter = _.forEach
    }

    spacing = Number(spacing)

    // get the spacing of the i-th gap
    // if there are fewer elements in 'spacing' than i
    // return the last element
    function get_spacing(i){
        if (_.isArray(spacing)){
            if (i >= spacing.length){
                return spacing[spacing.length-1]
            } else {
                return spacing[i]
            }
        } else {
            return spacing
        }
    }

    var d
    iter(solids, function(s, i) {
        if (_.isUndefined(d)){
            d = s.layout.position[dim]
        } else {
            var delta = {x:0, y:0, z:0}
            delta[dim] = d - s.layout.position[dim]
            s.translate(delta)
        }
        d = d + s.layout.size[dim] + get_spacing(i)
    })
}
