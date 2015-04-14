var React = require('react')
var CraftViewer = require('./craft-viewer')
var CraftEditor = require('./craft-editor')
var brcraft = require('../brcraft')

var ResizableBox = require('react-resizable').ResizableBox

module.exports = React.createClass({

    getInitialState: function() {
        console.log(this.props)
        return {
            contents: this.props.initialContents,
            useWorker: this.props.useWorker,
            renderCommandText: 'Initializing ...',
            exportCommandText: 'Export'
        }
    },

    doRender: function() {
        this.setState({renderCommandText: 'Rendering ...'})

        // var code = this.refs.editor.getValue()
        var code = this.state.contents
        var basePath = this.props.basePath
        var self = this        
        var context = {
            basePath: basePath,//window.location.href,
            origin: window.location.origin
        }
        console.log(context)

        brcraft
            .preview(code, context, {useWorker: this.state.useWorker})
            .then(function(results){
                console.log(results)
                self.didRender(results)
            })
    },

    doRender2: function(contents, basePath) {
        this.setState({status: 'Rendering ...'})

        var context = {
            basePath: basePath,
            origin: window.location.origin
        }

        brcraft
            .preview(contents, context, {useWorker: this.state.useWorker})
            .then(function(results){
                this.didRender(results)
            }.bind(this))
    },    

    doExport: function(){
        this.setState({exportCommandText: 'Exporting ...'})

        var code = this.refs.editor.getValue()
        var self = this
        var context = {
            basePath: window.location.href,
            origin: window.location.origin
        }        


        brcraft
            .build(code, context, {useWorker: this.state.useWorker})
            .then(function(result){
                self.didExport(result)
            })
    },

    didExport: function(result){
        //console.log('didExport',result)
        this.setState({exportCommandText: 'Export'})

        var blob = new Blob([result], {
            type: 'application/stla'
        })
        var blobURL = URL.createObjectURL(blob)

        var a = this.refs.download.getDOMNode()
        var name = 'export.stl'
        a.download = name
        a.href = blobURL
        a.click()
        window.URL.revokeObjectURL(blobURL)
    },

    didRender: function(result) {
        console.log('didRender',result)
        
        var viewer = this.refs.viewer

        var offset = {x:result.layout.size.x/2,y:result.layout.size.y/2,z:result.layout.size.z/2}

        // viewer.offset = offset
        // viewer.clear()
        viewer.initScene(offset)

        var colors = ['blue', 'orange', 'yellow', 'green', 'fuchsia', 'red']
        result.csgs.forEach(function(r, index) {
            var stlstring = r.stl
            var csg = {
                color: colors[index % 6],
                stl: stlstring
            }

            viewer.add(csg, offset)
        })

        // var editorHeight = this.refs.editor.getHeight()
        this.setState({renderCommandText: 'Refresh'})//, editorHeight: editorHeight})        
        this.setState({status: ''})//, editorHeight: editorHeight})        
        // console.log(editorHeight)
    },

    // handleHeightChange: function(height){                
    //     // if (this.props.autoResize){
    //         console.log('height:', height)
    //         var h = Math.max(height, 200) + 0  // enforce min height
    //         // this.setState({editorHeight:h})
    //         //this.refs.viewer.setHeight(h)
    //         // this.refs.viewer.setHeight('100%')

    //     // }
    // },

    componentDidMount: function() {

        window.addEventListener('resize', this.onWindowResize, false);        
        this.doRender()
        // if (this.props.file){
        //     this.props.file.emit('ready')
            
        //     this.props.file.on('modified', function(data) {
        //         this.setState(data)
        //         this.doRender2(data.contents, data.basePath)
        //     }.bind(this))


        //     this.props.file.on('parsed', function(data) {
        //         console.log('parsed', data)
        //     }.bind(this))

        //     this.props.file.on('rendered', function(data) {
        //         // console.log('r', data)
        //         // console.log(data)
        //         // this.refs.editor.setState({contents:contents})
        //         this.setState({contents: data.contents})
        //         this.didRender(data.rendered)
        //     }.bind(this))

        // }



        // console.log('h:',this.refs.editor.computeHeight('test\ntest'))
    },

    onWindowResize: function() {
        console.log('onWindowResize')
        this.setState({height: window.innerHeight - 40})
    },

    handleResize: function(){
        console.log('resizing')
        this.refs.viewer.refresh()
    },

    componentDidUpdate: function(){
        console.log('app:componentDidUpdate')
        this.refs.viewer.refresh()
    },

    editorOnChange: function(contents){
        console.log('app:editorOnChange')
        // this.forceUpdate()
        this.setState({contents:contents})
    },

    render: function() {

        var s1 = {   
            position: 'absolute',         
            top: 0,
            left: 0,            
            overflow: 'hidden',          
            height: '100%'
        }

        if (this.props.hideEditor){
            s1.display = 'none'
        }

        var s2 = {
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%'
        }
        var b1 = {
            position: 'inherit',
            fontFamily: 'arial',
            margin: 0,
            right: 10
        }

        var b2 = {
            position: 'inherit',
            fontFamily: 'arial',
            margin: 0,
            top: 20,
            right: 10
        }

        var r = {
            position: 'relative',
            height: '100%',
            padding: 0
        }

        var contents = this.state.contents //|| this.props.contents

        if (this.props.fitTo === 'container') {
            r.height = '100%'
        } else if (this.props.fitTo === 'contents') {        
            // r.height = this.refs.editor ? this.refs.editor.getHeight() : '100%'            
            r.height =  this.refs.editor ? this.refs.editor.computeHeight(contents) : '100%'
            console.log(r.height)
        }

        var n = {
            fontSize: '65%'
        }

        var a = {
            display: 'none'
        }

        var status = <div style={b2}>{this.state.status}</div>  

        var src
        if (this.state.src){
            src = <div style={b1}>
                        source: <a href={this.state.url}>{this.state.src}</a>
                  </div>    
        }    

        // var b = <div style={b}>
        //           <div className="button" onClick={this.doRender}>
        //                 <span>{this.state.renderCommandText}</span>                        
        //                 <br/><span className="button-caption">(shift-return)</span>
        //           </div>
        //           <div className="button" onClick={this.doExport}>
        //                 <span>{this.state.exportCommandText}</span>
        //           </div>         
        //       </div>    

        return (
            <div style={r}>
                <a ref="download" style={a}/>
                <div style={s2}>     
                    {src}                   
                    {status}
                    <CraftViewer ref='viewer'/>
                </div>            
                <div style={s1}>
                    <CraftEditor ref='editor' 
                        contents={contents}
                        onRefreshHotkey={this.doRender}
                        onChange={this.editorOnChange}
                    />
                </div>            
            </div>
        )
    }
})