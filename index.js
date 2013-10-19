var Watcher = require('watch-fs').Watcher,
    path = require('path'),
    spawn = require('child_process').spawn,
    debounce = require('lodash.debounce')

exports.createJung = create_jung
exports.Jung = Jung

function Jung(options, command) {
  if (!(this instanceof Jung)) return new Jung(options, command)
  this.blocked = false,
  this.queue = []
  this.options = options || {}
  if (!this.options.wait) this.options.wait = 500
  if (!this.options.root) this.options.root = [process.cwd()]
  this.command = command
  this.child = null

  return this
}

Jung.prototype.version = function () {
  var jung = require('./package.json')
  process.stdout.write('jung version ' + jung.version + '\n')
}

Jung.prototype.help = function () {
  var fs = require('fs')
  this.version()
  fs.createReadStream(path.join(__dirname, 'help.txt')).pipe(process.stdout)
}

Jung.prototype.execute = function (trigger_file) {
  if (this.blocked) {
    if (this.options.kill) {
      this.queue = [trigger_file]
      process.stdout.write('** Killing old process..\n\n')
      return this.child.kill()
    }
    process.stdout.write('--Queueing new process\n')
    return this.queue.push(trigger_file)
  }
  this.blocked = true

  var env = process.env,
      command = this.command.map(replace_env)

  env.JUNG_FILE = trigger_file

  process.stdout.write('** Running ``' + command.join(' ') + '``\n')
  this.child = spawn(command[0],
      command.slice(1),
      { env: env, cwd: process.cwd() })

  this.child.on('close', finish_child.bind(this))

  if (!this.options.quiet) {
    this.child.stdout.pipe(process.stdout)
    this.child.stderr.pipe(process.stderr)
  }

  function finish_child(code) {
    if (code !== 0 && !this.options.quiet) {
      process.stderr.write('\n** Command exited with code ' + code + '\n')
    }

    this.blocked = false
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
      },
      watcher = new Watcher(watcher_options)

  watcher.on('any', debounce(self.execute.bind(self), self.options.wait))
  watcher.start(function (err) {
    if (err) return console.error(err)
    if (!self.options.quiet) process.stdout.write('jung is listening..\n')
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
      return new RegExp(str)
    }
  }
}

function create_jung(options, command) {
  return new Jung(options, command)
}
