var THREE = require('./three.min.js')
require('./TrackballControls')
require('./STLLoader')

var Viewer = function(element) {
    this.renderer = null;
    this.controls = null;
    this.camera = null;
    this.scene = null;
    this.init(element);
};

//var keyboard = new KeyboardState();
var grids = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0]
];

Viewer.prototype = {
    constructor: Viewer,

    setCameraPosition: function(x, y, z) {
        this.camera.position.set(x, y, z);
    },

    clear: function() {
        this.initScene()
    },

    addCSG: function(csg) {

        // this.initScene();
        // console.debug('called')
        // console.log('called')//,GeometryUtils)
        var loader = new THREE.STLLoader();

        var stlstring = csg.stl
        var geometry = loader.parse(stlstring)
        var material = new THREE.MeshPhongMaterial({
            ambient: 0xff5533,
            // color: 0xff5533,
            color: csg.color,
            specular: 0x111111,
            shininess: 200
        });
        // geometry = new THREE.BoxGeometry( 1, 1, 1 );
         // geometry = new THREE.BoxGeometry( 1, 1, 1);
         // material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        var mesh = new THREE.Mesh(geometry, material);
        // mesh.position.set(0, 0, -20);

        mesh.scale.set(0.05, 0.05, 0.05) //, 0.1, 0.1 );        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);        
        this.render()
    },

    // addCSGs: function(csgs) {

    //     this.initScene();

    //     var loader = new THREE.STLLoader();

    //     var self = this
    //     csgs.forEach(function(csg) {
    //         var stlstring = csg.stl
    //         var geometry = loader.parse(stlstring)
    //         var material = new THREE.MeshPhongMaterial({
    //             ambient: 0xff5533,
    //             // color: 0xff5533,
    //             color: csg.color,
    //             specular: 0x111111,
    //             shininess: 200
    //         });
    //         var mesh = new THREE.Mesh(geometry, material);
    //         mesh.position.set(0, 0, 0);
    //         mesh.scale.set(0.02, 0.02, 0.02); //, 0.1, 0.1 );
    //         mesh.castShadow = true;
    //         mesh.receiveShadow = true;
    //         self.scene.add(mesh);
    //     })

    //     // console.log('utils',GeometryUtils)
    // },

    // // setStl: function(stlstring) {
    //     var loader = new THREE.STLLoader();
    //     var geometry = loader.parse(stlstring);
    //     var material = new THREE.MeshPhongMaterial({
    //         ambient: 0xff5533,
    //         color: 0xff5533,
    //         specular: 0x111111,
    //         shininess: 200
    //     });
    //     if (this.mesh) {
    //         this.scene.remove(this.mesh)
    //     }
    //     this.mesh = new THREE.Mesh(geometry, material);
    //     this.mesh.position.set(0, 0, 0);
    //     this.mesh.scale.set(0.02, 0.02, 0.02); //, 0.1, 0.1 );
    //     this.mesh.castShadow = true;
    //     this.mesh.receiveShadow = true;
    //     this.scene.add(this.mesh);
    // },

    // Viewer.prototype.addStl = function(stlstring) {
    //     var loader = new THREE.STLLoader();
    //     var geometry = loader.parse(stlstring);
    //     var material = new THREE.MeshPhongMaterial({
    //         ambient: 0xff5533,
    //         color: 0x333355,
    //         specular: 0x111111,
    //         shininess: 100,
    //         opacity: 0.2,
    //         transparent: true
    //     });
    //     var mesh = new THREE.Mesh(geometry, material);
    //     mesh.position.set(0, 0, 0);
    //     mesh.scale.set(0.02, 0.02, 0.02); //, 0.1, 0.1 );
    //     mesh.castShadow = true;
    //     mesh.receiveShadow = true;
    //     this.scene.add(mesh);
    // }

    initScene: function() {
        // New Scene
        this.scene = new THREE.Scene();
        // this.scene.fog = this.fog;
        this.scene.add(this.camera);

        if (0) {
            //Grids

            var grid;
            //x - yz
            grid = new Grid(1, 0.05);
            //grid.material = new THREE.MeshBasicMaterial({transparent:true});
            grid.rotation.z = Math.PI / 2;
            this.scene.add(grid);

            //y - xz
            grid = new Grid(1, 0.05);
            //grid.material = new THREE.MeshBasicMaterial({transparent:true});
            grid.rotation.y = Math.PI / 2;
            grid.rotation.z = Math.PI / 2;
            this.scene.add(grid);

            //z - xy
            grid = new Grid(1, 0.05);
            //grid.material = new THREE.MeshBasicMaterial({transparent:true});
            grid.rotation.x = Math.PI / 2;
            this.scene.add(grid);

            var color = 0xBBBBBB;
            this.scene.children[1].material.color.setHex(color);
            this.scene.children[2].material.color.setHex(color);
            this.scene.children[3].material.color.setHex(color);



        // Axis
        var axis;

        axis = new THREE.AxisHelper(1);
        axis.position.set(0.01, 0.01, 0.01);        
        // this.scene.add(axis);
    }

        // Lights
        this.scene.add(new THREE.AmbientLight(0x777777));
        this.addShadowedLight(1, 1, 1, 0xffffff, 1.35);
        this.addShadowedLight(0.5, 1, -1, 0xffaa00, 1);
        this.addShadowedLight(-1, -1, -1, 0xffaa00, 1);


    },

    addShadowedLight: function(x, y, z, color, intensity) {
        var directionalLight = new THREE.DirectionalLight(color, intensity);
        directionalLight.position.set(x, y, z)
        this.scene.add(directionalLight);
        directionalLight.castShadow = true;
        // directionalLight.shadowCameraVisible = true;
        var d = 1;
        directionalLight.shadowCameraLeft = -d;
        directionalLight.shadowCameraRight = d;
        directionalLight.shadowCameraTop = d;
        directionalLight.shadowCameraBottom = -d;
        directionalLight.shadowCameraNear = 1;
        directionalLight.shadowCameraFar = 4;
        directionalLight.shadowMapWidth = 1024;
        directionalLight.shadowMapHeight = 1024;
        directionalLight.shadowBias = -0.005;
        directionalLight.shadowDarkness = 0.15;
    },

    init: function(element) {

        this.container = element

        // this.fog = new THREE.Fog(0xffffff, 2, 15);

        // Camera
        var aspect = this.container.clientWidth / this.container.clientHeight
        this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 1000);
        // this.camera.position.y = 0
        // this.camera.position.set(0, 0, 50);
        // this.camera.position.z = 50
        // this.camera.lookAt( new THREE.Vector3(0, 0, 0) );
        // this.camera.fov = this.camera.fov * 3;//zoom;
        // this.camera.position.set(0, 100, -10);
        this.camera.updateProjectionMatrix()

        // renderer
        if (window.WebGLRenderingContext) {
            this.renderer = new THREE.WebGLRenderer({
                antialias: true
            })
        } else {
            this.renderer = new THREE.CanvasRenderer({
                preserveDrawingBuffer: true
            });
        }
        
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0xffffff, 1);
        // this.renderer.gammaInput = true;
        // this.renderer.gammaOutput = true;

        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.2;
        this.controls.noZoom = false;
        this.controls.noPan = false;
        this.controls.staticMoving = false;
        this.controls.dynamicDampingFactor = 0.3;
        this.controls.keys = [65, 83, 68];        

        var self = this;   
        this.controls.addEventListener('start', function() {
            // turn on the animatation at the start of a trackball control event
            self.animateOn();
        });

        this.controls.addEventListener('end', function() {
            // turn off the animatation at the end of a trackball control event
            self.animateOff();
        });


        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.initScene();
    },

    onWindowResize: function() {
        // console.debug("viewer resized:", this.container.clientWidth, this.container.clientHeight);
        // this.controls.handleResize()
        // this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        // this.camera.updateProjectionMatrix();
        // this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        // this.renderer.render(this.scene, this.camera);
    },

    // turn the animation on
    animateOn: function() {
        this.off = false;
        this.animate();
    },

    // turn the animation off
    animateOff: function() {
        this.off = true;
    },

    // animate continously, until it's turned off
    animate: function() {
        if (!this.off) {
            requestAnimationFrame(this.animate.bind(this));
        }
        this.render();
    },

    render: function() {
        this.controls.update()
        this.renderer.render(this.scene, this.camera)
    }
};

Grid = function(size, step) {

    var geometry = new THREE.Geometry();
    // var material = new THREE.MeshBasicMaterial({
    //     transparent: true
    // });

    var material = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        transparent: true
    })

    this.color1 = new THREE.Color(0x444444);
    this.color2 = new THREE.Color(0x888888);

    for (var i = -size; i <= size + step; i += step) {

        geometry.vertices.push(
            new THREE.Vector3(-size, 0, i), new THREE.Vector3(size, 0, i),
            new THREE.Vector3(i, 0, -size), new THREE.Vector3(i, 0, size)
        );

        var color = i === 0 ? this.color1 : this.color2;

        geometry.colors.push(color, color, color, color);

    }

    THREE.Line.call(this, geometry, material, THREE.LinePieces);

};

Grid.prototype = Object.create(THREE.Line.prototype);
Grid.prototype.constructor = Grid;

module.exports = Viewer