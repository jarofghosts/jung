const path = require('path')
const fs = require('fs')

const minimist = require('minimist')

const jung = require('../')
const pkg = require('../../package.json')

module.exports = bin

if (module === require.main) {
  bin()
}

function bin (ps = process) {
  const options = minimist(
    ps.argv.slice(2),
    {
      '--': true,
      'alias': {
        runfirst: 'R',
        version: 'v',
        help: 'h',
        quiet: 'q',
        kill: 'k',
        timeout: 't',
        wait: 'w',
        dir: 'd'
      }
    }
  )

  if (options._.length !== 0) {
    options.match = options._[0]
  }

  if (options.help || options['--'].length === 0) {
    help()

    return
  }

  if (options.version) {
    version()

    return
  }

  const runner = jung(options['--'].join(' '), options)

  if (!options.quiet) {
    runner
      .on('spawn', logSpawn)
      .on('queue', logQueue)
      .on('kill', logKill)
      .on('finish', logFinish)
      .on('terminate', logTerminate)
  }

  function logSpawn ([bin, ...args]) {
    log(`running ${bin} ${args.join(' ')}`)
  }

  function logKill () {
    log('killing...')
  }

  function logQueue ([bin, ...args]) {
    log(`queueing ${bin} ${args.join(' ')}`)
  }

  function logTerminate () {
    log('took to long to kill, TERMINATING')
  }

  function logFinish (code) {
    if (code !== 0) {
      log('command exited with non-zero code')
    }
  }

  function log (str) {
    ps.stderr.write(`${str}\n`)
  }

  function help () {
    version()

    fs.createReadStream(path.join(__dirname, '..', '..', 'help.txt'))
      .pipe(ps.stderr)
  }

  function version () {
    log(`jung version ${pkg.version}`)
  }
}
