var b = require('browserify')({debug:true}),
    fs = require('fs'),
    p = require('partialify/custom');
 
b.add('./lib/browser.js');
b.transform(p.alsoAllow('xml'));
b.bundle().pipe(fs.createWriteStream('../craftml-docs/contents/bundle.js'));