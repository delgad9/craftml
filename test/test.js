var craft = require('../lib/craft'),
    _ = require('lodash'),
    path = require('path')

var chai = require('chai'),
    expect = chai.expect,
    Assertion = chai.Assertion

var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    glob = require('glob'),
    mkdirp = require('mkdirp')

function buildStlAsync(path) {
    var src = path
    return fs.readFileAsync(src, 'utf8')
        .then(function(code) {
            var options = {
                basePath: path
            }
            return craft.build(code, options)
        })
        .then(function(r) {
            return r.toStlString()
        })
}

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

var mkdirp = require('mkdirp')
module.exports = function(src){
    // console.log(file)

    // return buildStlAsync(src)
    //     .then(function(stlstring){
    //         // console.log(ret)
    //         var stlfile = src + '.stl'
    //         var dest = './test/output/' + stlfile
    //         var oracle = './test/oracle/' + stlfile
    //
    //         mkdirp.sync(path.dirname(dest))
    //
    //         console.log('writing to ', dest)
    //         return fs.writeFileAsync(dest, stlstring)
    //         //     .then(_.partial(exportStlToImages, dest))
    //     })

    var stlfile = src + '.stl'
    var dest = './test/output/' + stlfile
    var oracle = './test/oracle/' + stlfile
    mkdirp.sync(path.dirname(dest))
    mkdirp.sync(path.dirname(oracle))

    return Promise.all([
            buildStlAsync(src),
            fs.readFileAsync(oracle, 'utf8')
                .catch(function(){
                    return 'new'
                })
        ])
        .spread(function(stl, expected) {

            // console.log('writing to ', dest)
            fs.writeFileAsync(dest, stl)

            // if oracle doesn't exist (new)
            if (expected == 'new'){
                // write it to the oracle folder pending manual verification
                oracle = oracle.replace('.stl', '.new.stl')
                fs.writeFileAsync(oracle, stl)

                // after manually verified, rename "foo.new.stl" to "foo.stl"
            }

            var n1 = stl.length
            var n2 = expected.length
            expect(n1).to.be.equal(n2)
            expect(headOf(stl)).to.be.equal(headOf(expected))
        })
}
