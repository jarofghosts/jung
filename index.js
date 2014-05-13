var spawn = require('child_process').spawn
  , EE = require('events').EventEmitter
  , inherits = require('util').inherits
  , path = require('path')
  , fs = require('fs')

var debounce = require('just-debounce')
  , watcher = require('node-watch')
  , color = require('bash-color')
  , subdirs = require('subdirs')

exports.createJung = create_jung
exports.Jung = Jung

function Jung(options, command) {
  if(!(this instanceof Jung)) return new Jung(options, command)
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

  if(!this.options.quiet) {
    this.on('killing', display_kill)
    this.on('queueing', display_queue)
    this.on('running', display_run)
    this.on('ran', display_ran)
  }

  return this
}

inherits(Jung, EE)

Jung.prototype.execute = function Jung$execute(trigger_file) {
  var self = this

  self.emit('triggered')
  if(!self.blocked) return do_execute()

  if(self.options.kill) {
    self.queue = [trigger_file]
    if(!self.child) return self.blocked = false

    self.emit('killing')
    self.timeout = setTimeout(force_kill, self.options.timeout)
    return self.child.kill()
  }

  self.emit('queueing', trigger_file)
  return self.queue.push(trigger_file)

  function do_execute() {
    var filename = path.basename(trigger_file)
      , extension = path.extname(filename)
      , dirname = path.dirname(trigger_file)
      , barename = filename.slice(0, -extension.length)

    self.blocked = true

    var env = process.env
      , command = self.command.map(replace_env)

    env.JUNG_FILE = trigger_file
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

    self.child.on('exit', finish_child)

    if(!self.options.quiet) {
      self.child.stdout.pipe(process.stdout)
      self.child.stderr.pipe(process.stderr)
    }

    function replace_env(str) {
      return str.replace(/\$JUNG_FILENAME/g, filename)
                .replace(/\$JUNG_FILE/g, trigger_file)
                .replace(/\$JUNG_EXTENSION/g, extension)
                .replace(/\$JUNG_DIR/g, dirname)
                .replace(/\$JUNG_BARENAME/g, barename)
    }

    function finish_child(code) {
      self.emit('ran', command.join(' '), code)
      self.blocked = false

      if(self.timeout) self.timeout = clearTimeout(self.timeout)
      if(self.queue.length) self.execute(self.queue.shift())
    }
  }

  function force_kill() {
    self.child && self.child.kill('SIGKILL')
  }
}

Jung.prototype.start = function Jung$start() {
  var self = this

  if(!fs.existsSync(self.options.root)) {
    display_error('!! Root dir `' + self.options.root + '` does not exist !!')
    return process.exit(1)
  }

  subdirs(self.options.root, start_jung)

  function start_jung(err, dirs) {
    dirs = dirs.filter(function filter_dirs(path) {
      return file_filter(false, path)
    })

    self.watcher = watcher(
        dirs.concat(self.options.root)
      , {recursive: false}
      , debounce(filter_event, self.options.wait)
    )

    self.emit('started')

    if(self.options.run) self.execute('')
    if(self.options.quiet) return

    process.stdout.write(color.yellow('jung is listening..') + '\n')
  }

  function filter_event(name) {
    if(file_filter(true, name)) self.execute(name)
  }

  function file_filter(is_file, name) {
    var opts = self.options
      , not_array = is_file ? opts.notfiles : opts.notdirs
      , good_array = is_file ? opts.files : opts.dirs

    not_array = (not_array || []).map(regex)
    good_array = (good_array || []).map(regex)

    for(var i = 0, l = good_array.length; i < l; ++i) {
      if(good_array[i].test(name)) return true
    }

    for(i = 0, l = not_array.length; i < l; ++i) {
      if(not_array[i].test(name)) return false
    }

    return !good_array.length
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

function create_jung(options, command) {
  return new Jung(options, command)
}

function display_run(command) {
  process.stdout.write(color.green('** Running `' + command + '`') + '\n')
}

function display_kill() {
  process.stdout.write(color.red('** Killing old process') + '\n')
}

function display_queue() {
  process.stdout.write(color.blue('-- Queueing new process') + '\n')
}

function display_ran(command, code) {
  if(!code) return
  process.stderr.write(color.red('@@ Command exited with code ' + code) + '\n')
}

function display_error(error) {
  process.stderr.write(color.red(error) + '\n')
}
