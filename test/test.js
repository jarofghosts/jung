var assert = require('assert'),
    Jung = require('../').Jung,
    jung,
    waiter

waiter = setTimeout(function () {
  assert.ok(false)
}, 500)

assert.doesNotThrow(function () {
  jung = new Jung(null, 'echo hello'.split(' '))
})

jung.execute('woo')
assert.ok(jung.blocked)
jung.child.stdout.on('data', function (data) {
  assert.equal(data.toString(), 'hello\n')
})
jung.on('ran', test_env)
function test_env() {
  jung = new Jung(null, 'echo \$JUNG_FILE'.split(' '))
  jung.on('ran', test_queue)
  jung.execute('wee')
  jung.child.stdout.on('data', function (data) {
    assert.equal(data.toString(), 'wee\n')
  })
}
function test_queue() {
  jung = new Jung(null, 'echo \$JUNG_FILE'.split(' '))
  jung.blocked = true
  var bad = setTimeout(assert.ok.bind(null, false), 500)
  jung.on('queueing', function () {
    clearTimeout(bad)
    test_kill()
  })
  jung.execute('waa')
}
function test_kill() {
  jung = new Jung({ kill: true }, 'echo \$JUNG_FILE')
  var bad = setTimeout(assert.ok.bind(null, false), 500)
  jung.blocked = true
  jung.on('killing', function () {
    clearTimeout(bad)
    test_quiet()
  })
  jung.execute('heee')
}
function test_quiet() {
  jung = new Jung({ quiet: true }, 'echo \$JUNG_FILE'.split(' '))
  jung.execute('haha')
  process.stdout.on('data', assert.ok.bind(null, false))
  jung.on('ran', clearTimeout.bind(null, waiter))
}
