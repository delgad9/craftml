import {renderElementList} from './render'

import CSSselect from 'css-select'
import _ from 'lodash'

function parseParamDefs(src){
    let params = {}
    _.forEach(CSSselect('> parameter', src), el => {

        if (el.attribs.name)
            params[el.attribs.name] = el

        if (el.attribs.alias)
            params[el.attribs.alias] = el
    })

    return params
}

export default class Craft {
    constructor(src){
        this.src = src
        this.name = this.src.attribs['name']
        this.static = true
        this.params = parseParamDefs(this.src)
    }

    render(solid, scope){
        if (this.src.attribs['grouping'] == 'off'){
            solid.role = 'merge'
        }

        // console.log(solid.src.attribs)
        let attribs = solid.src.attribs
        // console.log(this.paramDefs)
        // _resolveAttributesToParameters(scope, attribs, this.paramDefs)

        return renderElementList(solid, this.src.children, scope)
    }
}
