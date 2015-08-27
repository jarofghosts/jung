const EE = require('events')
const {spawn} = require('child_process')

const makeEnv = require('./make-environment')

module.exports = processRunner

function processRunner ({kill, command, runfirst, timeout, quiet}) {
  const runner = new EE()
  const [bin, ...args] = command = command.split(/\s+/)

  let queue = []
  let killTimer
  let child

  if (runfirst) {
    process.nextTick(runCommand)
  }

  runner.close = killChild
  runner.run = runCommand

  return runner

  function runCommand (filename = '') {
    const env = makeEnv(filename)

    const toRun = [bin, args.map(replaceEnv), {env}]

    killOrQueue(toRun)

    function replaceEnv (arg) {
      Object.keys(env).forEach(envVar => {
        arg = arg.replace(`$${envVar}`, env[envVar])
      })

      return arg
    }
  }

  function killOrQueue (toRun) {
    if (!kill) {
      runner.emit('queue', toRun)
      queue.push(toRun)
    } else {
      queue = [toRun]
    }

    if (!child) {
      queueNext()

      return
    }

    killChild()
  }

  function killChild () {
    if (!child) {
      return
    }

    runner.emit('kill')
    child.kill()

    killTimer = setTimeout(() => {
      runner.emit('terminate')
      child.kill('SIGTERM')
    }, timeout)
  }

  function finish (code) {
    runner.emit('finish', code)

    child = null

    if (killTimer) {
      clearTimeout(killTimer)
      killTimer = null
    }

    if (!queue.length) {
      return
    }

    queueNext()
  }

  function queueNext () {
    const toRun = queue.pop()

    child = spawn(...toRun)

    runner.emit('spawn', toRun)

    if (!quiet) {
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
    }

    child.once('close', finish)
  }
}
