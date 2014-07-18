var spawn = require('child_process').spawn
  , EE = require('events').EventEmitter
  , path = require('path')
  , fs = require('fs')

var debounce = require('just-debounce')
  , watcher = require('node-watch')
  , color = require('bash-color')
  , subdirs = require('subdirs')

module.exports = createJung

function Jung(options, command) {
  if(!(this instanceof Jung)) return new Jung(options, command)

  EE.call(this)

  command = command || []
  this.blocked = false
  this.watcher = null
  this.timeout = null
  this.child = null
  this.queue = []
  this.options = options || {}
  this.options.notdirs = this.options.notdirs || []
  this.options.notdirs.push(/\.git/)
  this.command = Array.isArray(command) ? command : command.split(' ')

  if(!this.options.wait) this.options.wait = 300
  if(!this.options.root) this.options.root = process.cwd()
  if(!this.options.timeout) this.options.timeout = 5000

  return this
}

Jung.prototype = Object.create(EE.prototype)

Jung.prototype.execute = function Jung$execute(triggerFile) {
  var self = this

  self.emit('triggered')
  if(!self.blocked) return execute()

  if(self.options.kill) {
    self.queue = [triggerFile]
    if(!self.child) return self.blocked = false

    self.emit('killing')
    self.timeout = setTimeout(forceKill, self.options.timeout)
    return self.child.kill()
  }

  self.emit('queueing', triggerFile)
  return self.queue.push(triggerFile)

  function execute() {
    var filename = path.basename(triggerFile)
      , extension = path.extname(filename)
      , dirname = path.dirname(triggerFile)
      , barename = filename.slice(0, -extension.length)

    self.blocked = true

    var env = process.env
      , command = self.command.map(replaceEnv)

    env.JUNG_FILE = triggerFile
    env.JUNG_FILENAME = filename
    env.JUNG_EXTENSION = extension
    env.JUNG_DIR = dirname
    env.JUNG_BARENAME = barename

    self.emit('running', command.join(' '))
    self.child = spawn(
        command[0]
      , command.slice(1)
      , {env: env, cwd: process.cwd()}
    )

    self.child.on('exit', finishChild)

    if(!self.options.quiet) {
      self.child.stdout.pipe(process.stdout)
      self.child.stderr.pipe(process.stderr)
    }

    function replaceEnv(str) {
      return str.replace(/\$JUNG_FILENAME/g, filename)
                .replace(/\$JUNG_FILE/g, triggerFile)
                .replace(/\$JUNG_EXTENSION/g, extension)
                .replace(/\$JUNG_DIR/g, dirname)
                .replace(/\$JUNG_BARENAME/g, barename)
    }

    function finishChild(code) {
      self.emit('ran', command.join(' '), code)
      self.blocked = false

      if(self.timeout) self.timeout = clearTimeout(self.timeout)
      if(self.queue.length) self.execute(self.queue.shift())
    }
  }

  function forceKill() {
    self.child && self.child.kill('SIGKILL')
  }
}

Jung.prototype.start = function Jung$start() {
  var self = this

  if(!fs.existsSync(self.options.root)) {
    self.emit(
        'error'
      , new Error('!! Root dir `' + self.options.root + '` does not exist !!')
    )

    return process.exit(1)
  }

  subdirs(self.options.root, startJung)

  function startJung(err, dirs) {
    dirs = dirs.filter(function filterDirs(path) {
      return fileFilter(false, path)
    })

    self.watcher = watcher(
        dirs.concat(self.options.root)
      , {recursive: false}
      , debounce(filterEvent, self.options.wait)
    )

    self.emit('started')

    if(self.options.run) self.execute('')
    if(self.options.quiet) return

    process.stdout.write(color.yellow('jung is listening') + '\n')
  }

  function filterEvent(name) {
    if(fileFilter(true, name)) self.execute(name)
  }

  function fileFilter(isFile, name) {
    var opts = self.options

    var notArray = isFile ? opts.notfiles : opts.notdirs
      , goodArray = isFile ? opts.files : opts.dirs
      , goodFiles = isFile ? opts.names : []

    notArray = (notArray || []).map(regex)
    goodArray = (goodArray || []).map(regex)

    if(goodFiles.indexOf(name) > -1) return true

    for(var i = 0, l = goodArray.length; i < l; ++i) {
      if(goodArray[i].test(name)) return true
    }

    for(i = 0, l = notArray.length; i < l; ++i) {
      if(notArray[i].test(name)) return false
    }

    return !(goodArray.length + goodFiles.length)
  }

  function regex(str) {
    if(str instanceof RegExp) return str
    return new RegExp(str)
  }
}

Jung.prototype.stop = function Jung$stop() {
  var self = this

  if(!self.blocked) return stop()

  self.child.on('exit', stop)
  self.child.kill()

  function stop() {
    self.watcher && self.watcher.close()
  }
}

function createJung(options, command) {
  return new Jung(options, command)
}
