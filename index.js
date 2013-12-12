var Watcher = require('watch-fs').Watcher,
    path = require('path'),
    spawn = require('child_process').spawn,
    color = require('bash-color'),
    debounce = require('lodash.debounce'),
    EE = require('events').EventEmitter,
    inherits = require('util').inherits

exports.createJung = create_jung
exports.Jung = Jung

function Jung(options, command) {
  if (!(this instanceof Jung)) return new Jung(options, command)
  command = command || ''
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

  return this
}

inherits(Jung, EE)

Jung.prototype.version = function () {
  var jung = require('./package.json')
  process.stdout.write(color.yellow('jung version ' + jung.version) + '\n')
}

Jung.prototype.help = function () {
  var fs = require('fs')
  this.version()
  fs.createReadStream(path.join(__dirname, 'help.txt')).pipe(process.stdout)
}

Jung.prototype.execute = function (trigger_file) {
  this.emit('triggered')
  if (this.blocked) {
    if (this.options.kill) {
      this.queue = [trigger_file]
      process.stdout.write(color.red('** Killing old process..') + '\n\n')
      this.emit('killing')
      if (this.child) {
        this.timeout = setTimeout(force_kill.bind(this), this.options.timeout)
        return this.child.kill()
      }
      return this.blocked = false
    }
    process.stdout.write(color.blue('-- Queueing new process') + '\n')
    this.emit('queueing', trigger_file)
    return this.queue.push(trigger_file)
  }
  this.blocked = true

  var env = process.env,
      command = this.command.map(replace_env)

  env.JUNG_FILE = trigger_file

  if (!this.options.quiet) {
    process.stdout.write(color.green('** Running `' + command.join(' ') + 
      '`') + '\n')
  }

  this.emit('running', command.join(' '))
  this.child = spawn(command[0],
      command.slice(1),
      { env: env, cwd: process.cwd() })

  this.child.on('exit', finish_child.bind(this))

  if (!this.options.quiet) {
    this.child.stdout.pipe(process.stdout)
    this.child.stderr.pipe(process.stderr)
  }

  function force_kill() {
    this.child && this.child.kill('SIGKILL')
  }

  function finish_child(code) {
    if (code && !this.options.quiet) {
      process.stderr.write('\n' + 
          color.red('@@ Command exited with code ' + code) + '\n')
    }

    this.emit('ran', command.join(' '))
    this.blocked = false
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    if (this.queue.length) this.execute(this.queue.shift())
  }
  function replace_env(str) {
    return str.replace(/\$JUNG_FILE/g, trigger_file)
  }

}

Jung.prototype.start = function () {
  var self = this,
      watcher_options = { paths: this.options.root, filters: {
          includeFile: make_filter('file'),
          includeDir: make_filter('dir')
        }
      }
  
  self.watcher = new Watcher(watcher_options)
  self.watcher.on('any', debounce(self.execute.bind(self), self.options.wait))
  self.watcher.start(function (err) {
    if (err) return console.error(err)
    self.emit('started')
    if (!self.options.quiet) process.stdout.write(
        color.yellow('jung is listening..') + '\n')
  })


  function make_filter(type) {
    var not_array = type === 'file' ?
          self.options.notfiles : self.options.notdirs,
        good_array = type === 'file' ?
          self.options.files : self.options.dirs

    not_array = (not_array || []).map(regex)
    good_array = (good_array || []).map(regex)

    return function (path) {
      for (var i = 0, l = good_array.length; i < l; ++i) {
        if (good_array[i].test(path)) return true
      }
      for (var i = 0, l = not_array.length; i < l; ++i) {
        if (not_array[i].test(path)) return false
      }
      return !good_array.length
    }

    function regex(str) {
      if (str instanceof RegExp) return str
      return new RegExp(str)
    }
  }
}

Jung.prototype.stop = function () {
  if (this.blocked) {
    this.child.kill()
    return this.child.on('exit', stop)
  }
  stop()

  function stop() {
    this.watcher && this.watcher.stop()
  }
}

function create_jung(options, command) {
  return new Jung(options, command)
}
