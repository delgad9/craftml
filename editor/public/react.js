var viewer

var CraftEditor = React.createClass({

    componentDidMount: function() {

        var defaultText = '<craft>\n\t<craft name="pin" module="sikuli/craft-pin"/>\n\t\t<pin></pin>\n\t\t\n</craft>'

        var editor = ace.edit("editor")
        var self = this
        editor.$blockScrolling = Infinity
        editor.setTheme("ace/theme/tomorrow")
        editor.getSession().setMode("ace/mode/xml")
        editor.setValue(defaultText, -1)
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
        this.setState({
            editor: editor
        })
    },

    getValue: function() {
        return this.state.editor.getValue()
    },

    render: function() {
        var style = {
            height: '100%',
            background: 'rgba(240,240,240,0.15)'
        }

        return ( < div >
            < div className = "editor"
            id = "editor"
            style = {
                style
            } >
            < /div>
            </div >
        )
    }
})

var CraftViewer = React.createClass({

    componentDidMount: function() {
        this.viewer = new Viewer('viewer')
        this.viewer.setCameraPosition(0, -2.5, 3)
        this.viewer.render()
    },

    add: function(csg) {
        this.viewer.addCSG(csg)
    },

    clear: function() {
        this.viewer.clear()
    },

    render: function() {
        var style = {
            height: '100%'
        }

        return ( < div className = "viewer"
            id = "viewer"
            style = {
                style
            } >
            < /div>
        )
    }
})

var CraftApp = React.createClass({

    refresh: function(){        
        var code = this.refs.editor.getValue()
        var viewer = this.refs.viewer

        craft
            .preview(code)
            .then(function(r) {
            
                viewer.clear()
                
                var colors = ['blue', 'orange', 'yellow', 'green', 'fuchsia', 'red']

                r.csgs.forEach(function(csg, index) {
                    var stlstring = csg.toStlString()
                    var csg = {
                        color: colors[index % 6],
                        stl: stlstring
                    }
                    
                    viewer.add(csg)
                })
            })
    },

    componentDidMount: function(){
        this.refresh()
    },

    render: function() {   

        var s1 = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '50%',
            height: '100%'        
        }
        var s2 = {position: 'absolute', top:0, left: 50, height:'100%', width:'100%'}
        var b = {
            position: 'absolute',
            right: 100,
            margin: 5
        }

        return (          
          <div className="row">
            <div className="row" style={s2}>            
              <div className="button" onClick={this.refresh} style={b}>
                    Build (shift+return)
              </div >
            <CraftViewer ref='viewer'/>
            </div>
            <div style={s1}>
                <CraftEditor ref='editor' onRefreshHotkey={this.refresh}/>
            </div>            
          </div>
        )
    }
})