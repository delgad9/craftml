import _ from 'lodash'

export function cut($scope) {
    let selector = this.attribs['cut']
    if (selector)
        this.layoutEval(`cut(${selector})`)
}

export function transform($scope) {
    let code = this.attribs['transform'] ||  this.attribs['t']
    if (code)
        this.transformEval(code)
}

export function layout($scope) {
    let code = this.attribs['layout'] || this.attribs['l']
    if (code)
        this.layoutEval(code)
}


import css from 'css'
export function style($scope){

    let cssRules = $scope.css

    if (this.attribs['style'] || this.attribs['color']){
        // grab style from attribute
        let cssText = _.get(this, 'attribs.style', '')

        // convert <g color="red"> to a css rule
        // --> color:red;

        let color = this.attribs['color']
        if (color){
            cssText = `color:${color};` + cssText
        }

        let ast = css.parse('* {' + cssText + '}')

        // add the new rules to the end
        cssRules = cssRules.concat(ast.stylesheet.rules)
    }

    // console.log(cssRules)
    this.computeStyle(cssRules)
}
