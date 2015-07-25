var jade = require('jade')
var _ = require('lodash')

var modelsPerPage = 9

module.exports = function(titles){

    var pages = _.map(_.chunk(titles, modelsPerPage), function(ch, i){

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

    })

    // console.log(JSON.stringify(pages,null,' '))
    console.log(pages.length, 'pages generated')

    var html = jade.renderFile(__dirname + '/report.jade', {pages: pages})
    return html
}
