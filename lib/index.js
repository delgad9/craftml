'strict'

var cheerio = require('cheerio')

function parse(xml) {

	var c = new Craft()
	var $ = cheerio.load(xml)


	var topCraftNode = $('craft')[0]
	// var contentNodes = $.root()[0].children[0].children
	var contentNodes = topCraftNode.children
	
	var contents = []
	contentNodes.forEach(function(node){
		if (node.name === 'script'){
			var script = new Script()
			script.text = $(node).text()
			script.type = $(node).attr('type')
			contents.push(script)
		}
	})
	
	c.contents = contents

	return c
}


function Craft(){
	// this.$ = $
	// this.contents = [new Script()]
}

// Craft.prototype.parameters = function(){
// 	return []
// }

// return a list of blocks, each block is a tree
// Craft.prototype.contents = function(){	
// }

function Script(){	
	this.text
	this.type
}

var lib = {
    parse: parse,
    Script: Script
}
module.exports = lib