module.exports = MyReporter;

var html = require('./html')
var fs = require('fs')
var _ = require('lodash')

function MyReporter(runner) {
  var passes = [];
  var failures = [];

  runner.on('pass', function(test){
    passes.push(test.fullTitle())
    console.log('pass: %s', test.fullTitle());
  });

  runner.on('fail', function(test, err){
    failures.push(test.fullTitle())
    console.log('fail: %s -- error: %s', test.fullTitle(), err.message);
  });

  runner.on('end', function(){
    console.log('end: %d/%d', passes.length, passes.length + failures.length)

    var output = html(passes)
    fs.writeFileSync('./test/preview/index.html', output)
    process.exit(failures);
    
  });
}
