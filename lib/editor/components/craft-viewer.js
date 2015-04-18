var React = require('react')
var Viewer = require('../viewer/viewer')
var _ = require('lodash')

var saveFile = function (strData, filename) {
        var link = document.createElement('a');
        if (typeof link.download === 'string') {
            document.body.appendChild(link); //Firefox requires the link to be in the body
            link.download = filename;
            link.href = strData;
            link.click();
            document.body.removeChild(link); //remove the link when done
        } else {
            location.replace(uri);
        }
    }

module.exports = React.createClass({

    getInitialState: function() {
        return {
            height: '100%'
        }
    },

    componentDidMount: function() {
        var v = this.refs.viewer.getDOMNode()
        this.viewer = new Viewer(v)
        this.viewer.setCameraPosition(0, -2.5, 3)
        this.viewer.render()
    },

    exportImage: function(){
        var strMime = "image/jpeg";
        console.log('viewer:export')
        var strMime = "image/jpeg"
        var strDownloadMime = "image/octet-stream"
        var imgData = this.viewer.renderer.domElement.toDataURL(strMime)
        saveFile(imgData.replace(strMime, strDownloadMime), "test.png");
    },

    setHeight: function(height){
        this.setState({height:height})
        this.viewer.onWindowResize()
    },

    refresh: function(){
        this.viewer.onWindowResize()
    },

    componentDidUpdate: function(){      
      if (this.viewer && this.props.contents){
        var p = this.props.contents
        var offset = {x:p.layout.size.x/2,y:p.layout.size.y/2,z:p.layout.size.z/2}
        this.viewer.initScene(offset)
        var colors = ['blue', 'orange', 'yellow', 'green', 'fuchsia', 'red']
        p.csgs.forEach(function(r, index) {
            var stlstring = r.stl
            var csg = {
                color: colors[index % 6],
                stl: stlstring
            }
            this.viewer.addCSG(csg, offset)
        }.bind(this))
      }
    },

    render: function() {
        console.log('viewer:render')
        var style = {
            height: '100%'
        }
        return ( <div className="viewer"
                    ref="viewer"
                    style={style}>
                 </div>
        )
    }
})
