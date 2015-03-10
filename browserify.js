var b = require('browserify')(),
    fs = require('fs'),
    p = require('partialify/custom');
 
b.add('./lib/browser.js');
b.transform(p.alsoAllow('xml'));
b.bundle().pipe(fs.createWriteStream('./editor/public/bundle.js'));