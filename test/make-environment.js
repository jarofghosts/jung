const test = require('tape')

const makeEnv = require('../lib/make-environment')

test('fills out env vars', t => {
  t.plan(5)

  const result = makeEnv('/lol/whatever/merp.jpg')

  t.equal(result.JUNG_FILE, '/lol/whatever/merp.jpg')
  t.equal(result.JUNG_FILENAME, 'merp.jpg')
  t.equal(result.JUNG_EXTENSION, '.jpg')
  t.equal(result.JUNG_DIR, '/lol/whatever')
  t.equal(result.JUNG_BARENAME, 'merp')
})
