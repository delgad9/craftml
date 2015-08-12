import Promise from 'bluebird'
import _ from 'lodash'

import {renderElementList} from './render'

export default function render_repeat($scope) {

    this.role = 'merge'    
    let {n, each, in: inExpr} = this.attribs
    if (n) {
        return repeat_n.call(this, n, $scope)
    } else if (each && inExpr) {
        return repeat_each.call(this, each, inExpr, $scope)
    }
}

function repeat_n(n, $scope){

    return renderElementList(this, this.src.children, $scope)
        .then(() => {

            let solids = this.children
            let m = solids.length

            for (let i = 0; i < n - 1; i++) {

                // clone each of the first N solids
                for (let j = 0; j < m; j++) {
                    let copy = solids[j].clone()
                    solids.push(copy)
                }
            }

            return solids
        })
}

function repeat_each(name, expr, $scope){
    let vs = expr//$scope.resolve(expr)
    let contents = vs.map(v => {
        $scope.parameters[name] = v
        return renderElementList(this, this.src.children, $scope)
    })
    return Promise.all(contents)
}
