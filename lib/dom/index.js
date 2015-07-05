import _ from 'lodash'

export default function dom(element) {

    let o = {
        getParameterByNameOrAlias: getParameterByNameOrAlias.bind(element),
        getParametersByType: getParametersByType.bind(element),
        hasContentByName: hasContentByName.bind(element),
        hasParameterByName: hasParameterByName.bind(element),
        getContentParameters: getContentParameters.bind(element)
    }
    // console.log(o)
    return o
}

function getParameterByNameOrAlias(txt){

        var name = {
            type: 'tag',
            name: 'parameter',
            attribs: {
                name: txt
            }
        }
        var alias = {
            type: 'tag',
            name: 'parameter',
            attribs: {
                alias: txt
            }
        }
        return _.find(this.children, name) || _.find(this.children, alias)
}

function getParametersByType(type) {

    return _.filter(this.children, function(element) {

        var pattern = {
            type: 'tag',
            name: 'parameter',
            attribs: {
                type: type
            }
        }

        return _.isMatch(element, pattern)
    })

}

function hasParameterByName(name) {

    return _.some(this.children, function(element) {

        var pattern = {
            type: 'tag',
            name: 'parameter',
            attribs: {
                name: name
            }
        }

        return _.isMatch(element, pattern)
    })
}

function hasContentByName(name){
    if (this.contents){
        return _.some(this.contents, function(c) {
            return c.attribs['name'] === name
        })
    } else {
        return false
    }
}

// recursively go down to collect all <content> tags
// this should probably happen during the parse time?
function getContentParameters(){

    var more = _.map(this.children, function(c){
        if (c.type === 'tag'){
            return getContentParameters.call(c)
        }
    }, this)

    if (this.name === 'content'){
        more.push(this)
    }
    return _.compact(_.flatten(more))
}
