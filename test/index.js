var test = require('tape')

var Jung = require('../')

test('starts successfully and executes command', function(t) {
  t.plan(3)
  var jung

  t.doesNotThrow(function() {
    jung = Jung({quiet: true}, 'echo hello'.split(' '))
  })

  jung.execute('woo')
  t.ok(jung.blocked)
  jung.child.stdout.on('data', function (data) {
    t.equal(data.toString(), 'hello\n')
  })
})

test('sets $JUNG vars', function(t) {
  t.plan(1)
  var jung = Jung(
      {quiet: true}
    , 'echo \$JUNG_FILE|\$JUNG_FILENAME|\$JUNG_EXTENSION|\$JUNG_DIR|' +
      '\$JUNG_BARENAME'.split(' ')
  )

  jung.execute('/path/wee.exe')

  jung.child.stdout.on('data', function (data) {
    t.equal(data.toString(), '/path/wee.exe|wee.exe|.exe|/path|wee\n')
  })
})

test('queues by default', function(t) {
  t.plan(1)
  var jung = Jung({quiet: true}, 'echo \$JUNG_FILE'.split(' '))

  jung.blocked = true

  jung.on('queueing', function() {
    t.ok(true)
  })

  jung.execute('waa')
})

test('can kill if specified', function(t) {
  t.plan(1)

  var jung = Jung(
      {kill: true, timeout: 1, quiet: true}
    , 'echo \$JUNG_FILE'
  )

  jung.blocked = true
  jung.child = {kill: function() {}}

  jung.on('killing', function() {
    t.ok(true)
  })

  jung.execute('heee')
})
