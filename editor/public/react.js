var viewer

var CraftEditor = React.createClass({

    componentDidMount: function() {        
        var editor = ace.edit("editor");
        var self = this;
        editor.$blockScrolling = Infinity
        editor.setTheme("ace/theme/tomorrow");
        editor.getSession().setMode("ace/mode/xml");
        editor.setValue('<craft>\n\t<row>\n\t\t<cube></cube>\n\t\t<cube></cube>\n\t<stl src="https://raw.githubusercontent.com/sikuli/craftml/master/test/fixtures/giraffe.stl"/></row>\n</craft>')
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
        this.setState({editor: editor})
    },

    getValue: function() {
        return this.state.editor.getValue()
    },

    render: function() {    
        var style = {
            height: '100%'
        }

        return (
            <div>
              <div className="editor" id="editor" style={style}>
              </div>
            </div>
        )
    }
})

var CraftViewer = React.createClass({

    componentDidMount: function() {
        this.viewer = new Viewer('viewer')
        this.viewer.setCameraPosition(0, -2.5, 3)
        this.viewer.render()
    },

    add: function(csg){
        this.viewer.addCSG(csg)
    },

    clear: function(){
        this.viewer.clear()
    },

    render: function() {    
        var style = {
            height: '100%'
        }

        return (
          <div className="viewer" id="viewer" style={style}>
          </div>
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

        return (
          <div className="row">
            <div className="six columns">
                <CraftEditor ref='editor' onRefreshHotkey={this.refresh}/>
            </div>  
            <div className="six columns">
              <div className="button" onClick={this.refresh}>
                    Build (shift+return)
              </div>
              <CraftViewer ref='viewer'/>
            </div>
          </div>
        )
    }
})