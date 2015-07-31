var chai = require('chai'),
    Assertion = chai.Assertion,
    _ = require('lodash'),
    G = require('../../lib/scad/geometry')

var headOf = function(x) {
    return x.slice(0, 100)
}

function closeTo(a, b) {
    return Math.abs(a - b) < 0.0001
}

function getName(solid) {
    return "solid<" + solid.name + ">"
}

function normalsToCenter(solid) {
    let c = solid.getCenter()
    if (solid.csg) {
        let distancesToOrigin = _.map(solid.csg.polygons, poly => {
            return poly.plane.signedDistanceToPoint(new G.Vector3D(c.x, c.y, c.z))
        })
        console.log(distancesToOrigin)
    }
}

Assertion.addMethod('role', function(expected) {
    var name = getName(this._obj)
    var actual = this._obj.role;

    // first, our instanceof check, shortcut
    // new Assertion(this._obj).to.be.eql(3)

    // second, our type check
    this.assert(
        expected == actual, "expected " + name + "'s role to be #{exp} but got #{act}", "expected " + name + "'s role not be #{act}", expected // expected
        , actual // actual
    );
})

chai.use(function(_chai, utils) {

    function resolve() {
        let solid, debugName
        if (utils.flag(this, 'selected')) {
            solid = utils.flag(this, 'selected')
            debugName = utils.flag(this, 'selected.name')
        } else if (_.isArray(this._obj)) {
            solid = this._obj[0]
            debugName = solid.name
        } else {
            solid = this._obj
            debugName = solid.name
        }
        return [solid, debugName]
    }

    Assertion.addChainableMethod('size', function(x, y, z) {
        let [solid, debugName] = resolve.call(this)
        let s = solid.size
        this.assert(
            closeTo(s.x, x) && closeTo(s.y, y) && closeTo(s.z, z),
            "expected " + debugName + "'s size to be #{exp} but got #{act}",
            "expected " + debugName + "'s size not be #{act}", {
                x: x,
                y: y,
                z: z
            }, // expected
            s // actual
        );
    })

    Assertion.addChainableMethod('position', function(x, y, z) {
        let [solid, debugName] = resolve.call(this)
        let s = solid.position
        this.assert(
            closeTo(s.x, x) && closeTo(s.y, y) && closeTo(s.z, z),
            "expected " + debugName + "'s position to be #{exp} but got #{act}",
            "expected " + debugName + "'s position not be #{act}", {
                x: x,
                y: y,
                z: z
            }, // expected
            s // actual
        );
    })

    Assertion.addChainableMethod('center', function(x, y, z) {
        let [solid, debugName] = resolve.call(this)
        var s = {
            x: solid.position.x + solid.size.x / 2,
            y: solid.position.y + solid.size.y / 2,
            z: solid.position.z + solid.size.z / 2
        }
        this.assert(
            closeTo(s.x, x) && closeTo(s.y, y) && closeTo(s.z, z),
            "expected " + debugName + "'s center to be #{exp} but got #{act}",
            "expected " + debugName + "'s center not be #{act}", {
                x: x,
                y: y,
                z: z
            }, // expected
            s // actual
        )
    })

    Assertion.addMethod('style', function(key, value) {
        let [solid, debugName] = resolve.call(this)
        var v = solid.style[key]
        this.assert(
            v === value,
            "expected " + debugName + "'s style to be #{exp} but got #{act}",
            "expected " + debugName + "'s style not to be #{act}",
            key + '=' + value, // expected
            key + '=' + v // actual
        )
    })

    Assertion.addChainableMethod('polygonCount', function(expected) {
        let [solid, debugName] = resolve.call(this)
        var actual = solid.getPolygonCount()

        // first, our instanceof check, shortcut
        // new Assertion(this._obj).to.be.eql(3)

        // second, our type check
        this.assert(
            expected == actual,
            "expected " + debugName + "'s polygon count to be #{exp} but got #{act}",
            "expected " + debugName + "'s polygon count  not be #{act}",
            expected, // expected
            actual // actual
        );
    })

    Assertion.addMethod('class', function(expected) {
        var name = getName(this._obj)
        var actual = this._obj.element.attribs['class'];

        // first, our instanceof check, shortcut
        // new Assertion(this._obj).to.be.eql(3)

        // second, our type check
        this.assert(
            expected == actual, "expected " + name + "'s id to be #{exp} but got #{act}", "expected " + name + "'s id not be #{act}", expected // expected
            , actual // actual
        );
    })

    Assertion.addMethod('id', function(expected) {
        var name = getName(this._obj)
        var actual = this._obj.element.attribs.id;

        // first, our instanceof check, shortcut
        // new Assertion(this._obj).to.be.eql(3)

        // second, our type check
        this.assert(
            expected == actual, "expected " + name + "'s id to be #{exp} but got #{act}", "expected " + name + "'s id not be #{act}", expected // expected
            , actual // actual
        );
    })

    Assertion.addMethod('name', function(expected) {
        var name = getName(this._obj)
        var actual = this._obj.name;

        // first, our instanceof check, shortcut
        // new Assertion(this._obj).to.be.eql(3)

        // second, our type check
        this.assert(
            expected == actual, "expected " + name + "'s name to be #{exp} but got #{act}", "expected " + name + "'s name not be #{act}", expected // expected
            , actual // actual
        );
    })

    function nth(oneBasedIndex) {
        this.assert(
            _.has(this._obj, oneBasedIndex - 1),
            `expected selection to have the ${oneBasedIndex}-th element`,
            `expected selection to not have the ${oneBasedIndex}-th element`)

        var s = this._obj[oneBasedIndex - 1]
        var name = `${oneBasedIndex}-th selection <${s.name}>`
        utils.flag(this, 'selected', s)
        utils.flag(this, 'selected.name', name)
    }

    Assertion.addChainableMethod('nth', nth)
    Assertion.addProperty('first', _.partial(nth, 1))
    Assertion.addProperty('second', _.partial(nth, 2))
    Assertion.addProperty('third', _.partial(nth, 3))
    Assertion.addProperty('fourth', _.partial(nth, 4))
    Assertion.addProperty('fifth', _.partial(nth, 5))
    Assertion.addProperty('with', function() {})


    Assertion.addProperty('normalsAwayFromCenter', function(){
        let [solid, debugName] = resolve.call(this)

        let c = solid.getCenter()
        if (solid.csg) {
            let distancesToOrigin = _.map(solid.csg.polygons, poly => {
                return poly.plane.signedDistanceToPoint(new G.Vector3D(c.x, c.y, c.z))
            })
            this.assert(
                _.all(distancesToOrigin, v => {
                    return v < 0
                }),
                "expected " + debugName + "'s surface normals to be all away from the center")
        }
    })

    Assertion.addMethod('normals', function(pos, neg){
        let [solid, debugName] = resolve.call(this)

        let c = solid.getCenter()
        if (solid.csg) {
            let distancesToOrigin = _.map(solid.csg.polygons, poly => {
                return poly.plane.signedDistanceToPoint(new G.Vector3D(c.x-10,c.y-10,c.z-10))
            })

            let [positive, negative] = _.partition(distancesToOrigin, v => {
                return v > 0
            })
            this.assert(
                positive.length == pos && negative.length == neg,
                `expected ${debugName}'s surface normals to be (+${pos}, -${neg}) from (10,10,10)
                but got (${positive.length}, ${negative.length})`)
        }
    })

    Assertion.addMethod('normalsAwayFromZ', function(z){
        let [solid, debugName] = resolve.call(this)

        let c = solid.getCenter()
        if (solid.csg) {
            let distancesToOrigin = _.map(solid.csg.polygons, poly => {
                return poly.plane.signedDistanceToPoint(new G.Vector3D(c.x, c.y, z))
            })
            console.log(distancesToOrigin)


            this.assert(
                _.all(distancesToOrigin, v => {
                    return v < 0
                }),
                `expected ${debugName}'s surface normals to be away from the z = ${z}`)
        }
    })
    //   Assertion.addChainableMethod('at', function (path) {
    //     var name = getName(this._obj)
    //     //var s = this._obj.layout.position;
    //
    //     var solid = this._obj
    //
    //     // path === [0,0]
    //
    //     var deepPropertyPath = _.map(path, function (p){
    //         // p === 0
    //         return 'children[' + p + ']'
    //     }).join('.')
    //
    //     // deepPropertyPath === children[0].children[0]
    //   //   console.log(deepPropertyPath)
    //
    //     if (utils.flag(this, 'negate')){
    //         new Assertion(this._obj).to.not.have.deep.property(deepPropertyPath)
    //     } else {
    //         new Assertion(this._obj).to.have.deep.property(deepPropertyPath)
    //     }
    //
    //     var descendent = _.get(solid, deepPropertyPath)
    //
    //     var solidName
    //     if (solidName = utils.flag(this, 'solid.name')) {
    //          //new Assertion(this._obj.element.name).to.be.eql(elementName)
    //          var expected = solidName
    //          var actual = descendent.name
    //
    //          this.assert(
    //            actual == expected,
    //            "expected solid at " + path + " to be #{exp} but got #{act}",
    //            "expected solid at " + path + " not to be #{exp} but got #{act}",
    //            expected,
    //            actual)
    //     }
    //
    //     this._obj = descendent
    // })

    // Assertion.addChainableMethod('solid', function (name) {
    //
    //     utils.flag(this, 'solid.name', name)
    //
    // })

    Assertion.addMethod('children', function(names) {

        var children

        if (_.isArray(this._obj)) {
            children = this._obj[0].children
        } else {
            children = this._obj.children
        }

        // assert the number of children should be equal
        var actual = children.length
        var expected = names.length

        this.assert(
            actual == expected,
            "expected the number of children to be #{exp} but got #{act}",
            "expected the number of children not to be #{exp} but got #{act}",
            expected,
            actual)

        _.forEach(children, function(c, i) {

            var expected = names[i]
            var actual = c.name

            this.assert(
                actual == expected,
                "expected children[" + i + "] to be #{exp} but got #{act}",
                "expected children[" + i + "] not to be #{exp} but got #{act}",
                expected,
                actual)
        }.bind(this))
    })

})




// Assertion.addChainableMethod('position', function (x,y,z) {
//   var name = getName(this._obj)
//   var s = this._obj.position;
//
//   // first, our instanceof check, shortcut
//   // new Assertion(this._obj).to.be.eql(3)
//
//   // second, our type check
//   this.assert(
//       closeTo(s.x,x) && closeTo(s.y,y) && closeTo(s.z,z)
//     , "expected " + name + "'s position to be #{exp} but got #{act}"
//     , "expected " + name + "'s position not be #{act}"
//     , {x:x, y:y, z:z}        // expected
//     , s   // actual
//   );
// })

// language chain method
// Assertion.addMethod('style', function (key, value) {
//   var name = getName(this._obj)
//   var v = this._obj.style[key];
//
//   this.assert(
//       v === value
//     , "expected " + name + "'s style to be #{exp} but got #{act}"
//     , "expected " + name + "'s style not to be #{act}"
//     , key + '=' + value  // expected
//     , key + '=' + v  // actual
//   );
// })
