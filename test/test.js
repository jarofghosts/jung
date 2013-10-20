var assert = require('assert'),
    Jung = require('../').Jung,
    jung

assert.doesNotThrow(function () {
  jung = new Jung(null, 'echo hello'.split(' '))
})

jung.execute('woo')
jung.child.stdout.on('data', function (data) {
  assert.equal(data.toString(), 'hello\n')
})
