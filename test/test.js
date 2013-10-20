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

jung = new Jung(null, 'echo \$JUNG_FILE'.split(' '))
jung.execute('wee')
jung.child.stdout.on('data', function (data) {
  assert.equal(data.toString(), 'wee\n')
})
