var jade = require('jade')
var _ = require('lodash')

module.exports = function(titles){

    var pages = _.map(_.chunk(titles, 12), function(ch, i){

        var items = _.map(ch, function(m){

            var toks = m.split(' ')

            return {
                name: _.last(toks),
                title: m
            }
        })

        return {
            index: i,
            items: items
        }

        // console.log(ch)
    })

    console.log(JSON.stringify(pages,null,' '))

    var html = jade.renderFile(__dirname + '/report.jade', {pages: pages})
    return html
}
