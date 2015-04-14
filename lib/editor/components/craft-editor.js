var React = require('react')
var ace = require('brace')
var _ = require('lodash')

require('brace/mode/html')
require('brace/theme/tomorrow')

module.exports = React.createClass({

    getInitialState: function() {
        return {
            width: 200
        }
    },

    componentDidMount: function() {
        console.log('editor:componentDidMount')

        var contents = this.props.contents
        contents = _.trim(contents)

        var ed = this.refs.editor.getDOMNode()

        var editor = ace.edit(ed)
        var self = this
        editor.$blockScrolling = Infinity
        // editor.setReadOnly(true)
        editor.setValue(contents, -1)
        editor.setTheme("ace/theme/tomorrow")
        editor.getSession().setMode("ace/mode/html")
        editor.getSession().setUseWorker(false)
        editor.commands.addCommand({
            name: "refresh",
            bindKey: {
                win: "Shift-Return",
                mac: "Shift-Return"
            },
            exec: function(editor) {
                console.debug('shift-return pressed')                
                self.props.onRefreshHotkey()
            }
        })
        editor.getSession().on('change', this.handleChange)
        // this.setState({
        //     editor: editor
        // })
        this.editor = editor     
        
        this.setState({width:this.getContentWidth()})        
    },

    componentDidUpdate: function(){
        // console.log('componentDidUpdate',this)
        // editor.setValue(this.props.contents, -1)
    },

    componentWillUpdate: function(){
        // console.log('componentWillUpdate',this)
        // console.log(this.props.contents)
        // this.editor.setValue(this.props.contents, -1)
        // editor.setValue(this.props.contents, -1)
    },


    handleChange: function(){
        console.log('editor:handleChange')
        if (this.props.onChange){
            this.props.onChange(this.editor.getValue())
            this.setState({width:this.getContentWidth()})
            // this.editor.resize()
        }
        // if (this.props.onHeightChange && this.props.autoResize){            
        //     this.props.onHeightChange(this.getHeight())            
        // }
        // this.setState({width:this.getContentWidth()})
    },

    getValue: function() {        
        return this.editor.getValue()
    },

    getContentWidth: function(){
        var w = this.editor.getSession().getScreenWidth() * this.editor.renderer.characterWidth
        var gutterWidth = this.editor.renderer.$gutterLayer.gutterWidth  || 41
        w += gutterWidth
        return w
    },

    componentDidUpdate: function(){
        console.log('editor:componentDidUpdate')
        //this.editor.resize()
        this.editor.resize()
    },

    getHeight: function() {        
        var h = this.editor.getSession().getScreenLength()
                * this.editor.renderer.lineHeight
                + this.editor.renderer.scrollBar.getWidth()        
        return h
    },

    computeHeight: function(contents){
        var h = contents.split('\n').length
                * this.editor.renderer.lineHeight
                + this.editor.renderer.scrollBar.getWidth()        
        return h
    },

    // shouldComponentUpdate: function(nextProps, nextState) {
    //     console.log('editor:shouldComponentUpdate', nextProps.contents.length, this.props.contents.length)
    //     var isSameContents = nextProps.contents == this.editor.getValue()//.contents
    //     console.log('editor:isSameContents',isSameContents)
    //     return !isSameContents        
    // },    

    render: function() {
        console.log('editor:render')
        var style = {
            height: '100%',
            paddingRight: 30,
            background: 'rgba(240,240,240,0.15)'
        }

        if (this.editor){
            this.editor.getSession().removeListener('change',this.handleChange)
            var isSameContents = this.props.contents == this.editor.getValue()
            if (!isSameContents){
                this.editor.setValue(this.props.contents, -1)    
            }
            this.editor.getSession().on('change',this.handleChange)
            style.width = this.getContentWidth()
        }

        return (<div className = "editor"
                ref = "editor"
                style = {style}>
               </div>)
    }
})