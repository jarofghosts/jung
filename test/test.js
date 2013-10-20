var assert = require('assert'),
    Jung = require('../').Jung,
    jung

assert.doesNotThrow(function () {
  jung = new Jung(null, 'echo "hello"'.split(' '))
})

