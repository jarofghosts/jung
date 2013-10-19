#!/usr/bin/env node

var watch = require('fs-watch').Watcher,
    nopt = require('nopt'),
    path = require('path'),
    spawn = require('child_process').spawn,
    debounce = require('lodash.debounce'),
    blocked = false,
    process,
    command,
    watcher

var noptions = {
  root: Array,
  files: Array,
  dirs: Array,
  notfiles: Array,
  notdirs: Array,
  verbose: Boolean,
  help: Boolean,
  version: Boolean
},
    shorts = {
  r: ['--root'],
  d: ['--dirs'],
  f: ['--files'],
  D: ['--notdirs'],
  F: ['--notfiles'],
  v: ['--verbose'],
  h: ['--help'],
  V: ['--version']
},
options = nopt(noptions, shorts, process.argv)
command = options.argv.remain

if (!command.length || options.help) return help()

watcher = new Watcher()

watcher.on('any', debounce(trigger_command))

function trigger_command() {
  if (blocked) return console.log('previous process still running')
  blocked = true
  var child = spawn(command[0], command.slice(1))
  child.on('close', finish_child)

  if (options.verbose) {
    child.process.stdout.pipe(process.stdout)
    child.process.stderr.pipe(process.stderr)
  }

  function finish_child(code) {
    if (code !== 0) process.stderr.write('command exited with code ' + code)
    blocked = false
  }

}

watcher.start()
