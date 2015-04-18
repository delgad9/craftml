var React = require('react')
var CraftViewer = require('./craft-viewer')
var CraftEditor = require('./craft-editor')

module.exports = React.createClass({

    getInitialState: function() {
        return {
            contents: this.props.initialContents,
            useWorker: this.props.useWorker,
            renderCommandText: 'Initializing ...',
            exportCommandText: 'Export'
        }
    },

    doRender: function() {
        this.setState({status: 'Rendering ...'})
        this.setState({renderCommandText: 'Rendering ...'})

        var code = this.state.contents
        var basePath = this.props.basePath
        var context = {
            basePath: basePath,//window.location.href,
            origin: window.location.origin
        }

        this.props.craftml
            .preview(code, context)
            .then(function(previewable){
                console.log('app:previewable', previewable)
                this.setState({previewable: previewable})
                this.setState({renderCommandText: 'Refresh'})
                this.setState({status: ''})

            }.bind(this))
            .catch(function(e){
                console.log(e)
            })
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
        this.setState({previewable: previewable})
        this.setState({renderCommandText: 'Refresh'})
        this.setState({status: ''})
    },

    componentDidMount: function() {
        window.addEventListener('resize', this.onWindowResize, false);
        this.doRender()
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
        // console.log('app:componentDidUpdate')
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

        this.state.previewable =  this.state.previewable || this.props.previewable

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
                    <CraftViewer
                        ref='viewer'
                        contents={this.state.previewable}/>
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
