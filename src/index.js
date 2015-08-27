require('babel/polyfill')

const EE = require('events')
const path = require('path')

const chokidar = require('chokidar')
const debounce = require('just-debounce')

const processRunner = require('./process-runner')

module.exports = jung

const CWD = process.cwd()
const EVENTS = new Set(['spawn', 'finish', 'kill', 'queue', 'terminate'])

function jung (command, {
  dir = CWD,
  wait = 300,
  timeout = 500,
  match = '*',
  kill = false,
  quiet = false,
  runfirst = false
} = {}) {
  const runner = processRunner({kill, command, runfirst, timeout, quiet})
  const watcher = chokidar.watch(
    match,
    {ignored: '.git/**/*', cwd: dir, ignoreInitial: true}
  )
  const ee = new EE()

  for (let event of EVENTS) {
    runner.on(event, ee.emit.bind(event))
  }

  watcher.on('all', debounce((event, filename) => {
    runner.run(path.join(dir, filename))
  }, wait, true))

  ee.close = close

  return ee

  function close () {
    runner.close()
    watcher.close()
  }
}
