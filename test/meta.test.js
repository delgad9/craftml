var meta = require('../lib/meta')

describe('#meta', function(){
    it('title', function(){
        return meta('<craft><info><title>my title</title></info></craft>')
            .then(function(m){
                m.info.should.have.property('title').and.eql('my title')
            })
    })

    it('name', function() {
        return meta('<craft name="foo"></craft>')
            .then(function(m){
                m.should.have.property('name').and.eql('foo')
            })
    })
})
