var chai = require('chai'),
    Assertion = chai.Assertion

var headOf = function(x) {
    return x.slice(0, 100)
}

function closeTo(a,b){
    return Math.abs(a-b)<0.0001
}

// language chain method
Assertion.addMethod('size', function (x,y,z) {
  var name = "solid[name=" + this._obj.name + "]"
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

// language chain method
Assertion.addMethod('center', function (x,y,z) {
  var name = "solid[name=" + this._obj.name + "]"
  var l = this._obj.layout;
  var s = {
      x: l.location.x + l.size.x/2,
      y: l.location.y + l.size.y/2,
      z: l.location.z + l.size.z/2
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


Assertion.addMethod('location', function (x,y,z) {
  var name = "solid[name=" + this._obj.name + "]"
  var s = this._obj.layout.location;

  // first, our instanceof check, shortcut
  // new Assertion(this._obj).to.be.eql(3)

  // second, our type check
  this.assert(
      closeTo(s.x,x) && closeTo(s.y,y) && closeTo(s.z,z)
    , "expected " + name + "'s location to be #{exp} but got #{act}"
    , "expected " + name + "'s location not be #{act}"
    , {x:x, y:y, z:z}        // expected
    , s   // actual
  );
})

// language chain method
Assertion.addMethod('style', function (key, value) {
  var name = "solid[name=" + this._obj.name + "]"
  var v = this._obj.style[key];

  this.assert(
      v === value
    , "expected " + name + "'s style to be #{exp} but got #{act}"
    , "expected " + name + "'s style not to be #{act}"
    , key + '=' + value  // expected
    , key + '=' + v  // actual
  );
})
