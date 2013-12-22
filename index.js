var Watcher = require('watch-fs').Watcher,
    spawn = require('child_process').spawn,
    color = require('bash-color'),
    debounce = require('debounce'),
    EE = require('events').EventEmitter,
    inherits = require('util').inherits

exports.createJung = create_jung
exports.Jung = Jung

function Jung(options, command) {
  if (!(this instanceof Jung)) return new Jung(options, command)
  command = command || []
  this.blocked = false
  this.watcher = null
  this.timeout = null
  this.child = null
  this.queue = []
  this.options = options || {}
  this.command = Array.isArray(command) ? command : command.split(' ')

  if (!this.options.wait) this.options.wait = 300
  if (!this.options.root) this.options.root = [process.cwd()]
  if (!this.options.timeout) this.options.timeout = 5000

  if (!this.options.quiet) {
    this.on('killing', display_kill)
    this.on('queueing', display_queue)
    this.on('running', display_run)
    this.on('ran', display_ran)
  }

  return this
}

inherits(Jung, EE)

Jung.prototype.execute = function jung_execute(trigger_file) {
  var self = this

  self.emit('triggered')
  if (!self.blocked) return do_execute()

  if (self.options.kill) {
    self.queue = [trigger_file]
    if (!self.child) return self.blocked = false

    self.emit('killing')
    self.timeout = setTimeout(force_kill, self.options.timeout)
    return self.child.kill()
  }

  self.emit('queueing', trigger_file)
  return self.queue.push(trigger_file)

  function do_execute() {
    self.blocked = true

    var env = process.env,
        command = self.command.map(replace_env)

    env.JUNG_FILE = trigger_file

    self.emit('running', command.join(' '))
    self.child = spawn(command[0],
        command.slice(1),
        { env: env, cwd: process.cwd() })

    self.child.on('exit', finish_child)

    if (!self.options.quiet) {
      self.child.stdout.pipe(process.stdout)
      self.child.stderr.pipe(process.stderr)
    }

    function finish_child(code) {
      self.emit('ran', command.join(' '), code)
      self.blocked = false

      if (self.timeout) self.timeout = clearTimeout(self.timeout)
      if (self.queue.length) self.execute(self.queue.shift())
    }
  }

  function force_kill() {
    self.child && self.child.kill('SIGKILL')
  }

  function replace_env(str) {
    return str.replace(/\$JUNG_FILE/g, trigger_file)
  }
}

Jung.prototype.start = function jung_start() {
  var self = this,
      watcher_options = {}

  watcher_options.paths = this.options.root
  watcher_options.filters = {
    includeFile: make_filter('file'),
    includeDir: make_filter('dir')
  }
  
  self.watcher = new Watcher(watcher_options)
  self.watcher.on('any', debounce(self.execute.bind(self), self.options.wait))
  self.watcher.start(on_watcher_started)

  function make_filter(type) {
    var not_array = type === 'file' ?
          self.options.notfiles : self.options.notdirs,
        good_array = type === 'file' ?
          self.options.files : self.options.dirs

    not_array = (not_array || []).map(regex)
    good_array = (good_array || []).map(regex)

    return function compile_filter(path) {
      var i,
          l

      for (i = 0, l = good_array.length; i < l; ++i) {
        if (good_array[i].test(path)) return true
      }
      for (i = 0, l = not_array.length; i < l; ++i) {
        if (not_array[i].test(path)) return false
      }
      return !good_array.length
    }

    function regex(str) {
      if (str instanceof RegExp) return str
      return new RegExp(str)
    }
  }

  function on_watcher_started(err) {
    if (err) return console.error(err)
    self.emit('started')
    if (self.options.quiet) return
    process.stdout.write(color.yellow('jung is listening..') + '\n')
  }
}

Jung.prototype.stop = function jung_stop() {
  if (!this.blocked) return stop()

  this.child.on('exit', stop)
  this.child.kill()

  function stop() {
    this.watcher && this.watcher.stop()
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
  if (!code) return
  process.stderr.write(color.red('@@ Command exited with code ' + code) + '\n')
}
