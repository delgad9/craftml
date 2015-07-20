var chai = require('chai'),
    Assertion = chai.Assertion,
    _ = require('lodash')

var headOf = function(x) {
    return x.slice(0, 100)
}

function closeTo(a,b){
    return Math.abs(a-b)<0.0001
}

function getName(solid){
    return "solid<" + solid.name + ">"
}

// language chain method
Assertion.addMethod('size', function (x,y,z) {
  var name = getName(this._obj)
  var s = this._obj.layout.size;

  // first, our instanceof check, shortcut
  // new Assertion(this._obj).to.be.eql(3)

  // second, our type check
  this.assert(
      closeTo(s.x,x) && closeTo(s.y,y) && closeTo(s.z,z)
    , "expected " + name + "'s size to be #{exp} but got #{act}"
    , "expected " + name + "'s size not be #{act}"
    , {x:x, y:y, z:z}        // expected
    , s   // actual
  );
})

Assertion.addMethod('role', function (expected) {
  var name = getName(this._obj)
  var actual = this._obj.role;

  // first, our instanceof check, shortcut
  // new Assertion(this._obj).to.be.eql(3)

  // second, our type check
  this.assert(
      expected == actual
    , "expected " + name + "'s role to be #{exp} but got #{act}"
    , "expected " + name + "'s role not be #{act}"
    , expected   // expected
    , actual   // actual
  );
})

// language chain method
Assertion.addMethod('center', function (x,y,z) {
  var name = getName(this._obj)
  var l = this._obj.layout;
  var s = {
      x: l.position.x + l.size.x/2,
      y: l.position.y + l.size.y/2,
      z: l.position.z + l.size.z/2
  }

  // first, our instanceof check, shortcut
  // new Assertion(this._obj).to.be.eql(3)

  // second, our type check
  this.assert(
      closeTo(s.x,x) && closeTo(s.y,y) && closeTo(s.z,z)
    , "expected " + name + " is centered at #{exp} but got #{act}"
    , "expected " + name + "'s center is not at #{act}"
    , {x:x, y:y, z:z}        // expected
    , s   // actual
  );
})

chai.use(function (_chai, utils) {

    Assertion.addMethod('class', function (expected) {
      var name = getName(this._obj)
      var actual = this._obj.element.attribs['class'];

      // first, our instanceof check, shortcut
      // new Assertion(this._obj).to.be.eql(3)

      // second, our type check
      this.assert(
          expected == actual
        , "expected " + name + "'s id to be #{exp} but got #{act}"
        , "expected " + name + "'s id not be #{act}"
        , expected   // expected
        , actual   // actual
      );
    })

    Assertion.addMethod('id', function (expected) {
      var name = getName(this._obj)
      var actual = this._obj.element.attribs.id;

      // first, our instanceof check, shortcut
      // new Assertion(this._obj).to.be.eql(3)

      // second, our type check
      this.assert(
          expected == actual
        , "expected " + name + "'s id to be #{exp} but got #{act}"
        , "expected " + name + "'s id not be #{act}"
        , expected   // expected
        , actual   // actual
      );
    })

    Assertion.addChainableMethod('polygonCount', function (expected) {
      var name = getName(this._obj)
      var actual = this._obj.getPolygonCount()

      // first, our instanceof check, shortcut
      // new Assertion(this._obj).to.be.eql(3)

      // second, our type check
      this.assert(
          expected == actual
        , "expected " + name + "'s polygon count to be #{exp} but got #{act}"
        , "expected " + name + "'s polygon count  not be #{act}"
        , expected   // expected
        , actual   // actual
      );
    })

    Assertion.addMethod('name', function (expected) {
      var name = getName(this._obj)
      var actual = this._obj.element.name;

      // first, our instanceof check, shortcut
      // new Assertion(this._obj).to.be.eql(3)

      // second, our type check
      this.assert(
          expected == actual
        , "expected " + name + "'s name to be #{exp} but got #{act}"
        , "expected " + name + "'s name not be #{act}"
        , expected   // expected
        , actual   // actual
      );
    })

    Assertion.addChainableMethod('at', function (path) {
      var name = getName(this._obj)
      //var s = this._obj.layout.position;

      var solid = this._obj

      // path === [0,0]

      var deepPropertyPath = _.map(path, function (p){
          // p === 0
          return 'children[' + p + ']'
      }).join('.')

      // deepPropertyPath === children[0].children[0]
    //   console.log(deepPropertyPath)

      if (utils.flag(this, 'negate')){
          new Assertion(this._obj).to.not.have.deep.property(deepPropertyPath)
      } else {
          new Assertion(this._obj).to.have.deep.property(deepPropertyPath)
      }

      var descendent = _.get(solid, deepPropertyPath)

      var solidName
      if (solidName = utils.flag(this, 'solid.name')) {
           //new Assertion(this._obj.element.name).to.be.eql(elementName)
           var expected = solidName
           var actual = descendent.name

           this.assert(
             actual == expected,
             "expected solid at " + path + " to be #{exp} but got #{act}",
             "expected solid at " + path + " not to be #{exp} but got #{act}",
             expected,
             actual)
      }

      this._obj = descendent
  })

  Assertion.addChainableMethod('solid', function (name) {

      utils.flag(this, 'solid.name', name)

  })

  Assertion.addMethod('children', function (names) {

      var children = this._obj.children

      // assert the number of children should be equal
      var actual = children.length
      var expected = names.length

      this.assert(
        actual == expected,
        "expected the number of children to be #{exp} but got #{act}",
        "expected the number of children not to be #{exp} but got #{act}",
        expected,
        actual)

      _.forEach(children, function (c,i){

          var expected = names[i]
          var actual = c.element.name

          this.assert(
            actual == expected,
            "expected children[" + i + "] to be #{exp} but got #{act}",
            "expected children[" + i + "] not to be #{exp} but got #{act}",
            expected,
            actual)
      }.bind(this))
  })

})




Assertion.addChainableMethod('position', function (x,y,z) {
  var name = getName(this._obj)
  var s = this._obj.layout.position;

  // first, our instanceof check, shortcut
  // new Assertion(this._obj).to.be.eql(3)

  // second, our type check
  this.assert(
      closeTo(s.x,x) && closeTo(s.y,y) && closeTo(s.z,z)
    , "expected " + name + "'s position to be #{exp} but got #{act}"
    , "expected " + name + "'s position not be #{act}"
    , {x:x, y:y, z:z}        // expected
    , s   // actual
  );
})

// language chain method
Assertion.addMethod('style', function (key, value) {
  var name = getName(this._obj)
  var v = this._obj.style[key];

  this.assert(
      v === value
    , "expected " + name + "'s style to be #{exp} but got #{act}"
    , "expected " + name + "'s style not to be #{act}"
    , key + '=' + value  // expected
    , key + '=' + v  // actual
  );
})
