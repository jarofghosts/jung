#!/usr/bin/env node

var Watcher = require('fs-watch').Watcher,
    nopt = require('nopt'),
    path = require('path'),
    spawn = require('child_process').spawn,
    debounce = require('lodash.debounce'),
    blocked = false,
    noptions = {
      root: Array,
      files: Array,
      dirs: Array,
      notfiles: Array,
      notdirs: Array,
      wait: Number,
      verbose: Boolean,
      help: Boolean,
      version: Boolean
    },
        shorts = {
      r: ['--root'],
      d: ['--dirs'],
      f: ['--files'],
      w: ['--wait'],
      D: ['--notdirs'],
      F: ['--notfiles'],
      v: ['--verbose'],
      h: ['--help'],
      V: ['--version']
    },
  options = nopt(noptions, shorts, process.argv),
  command = options.argv.remain

if (!command.length || options.help) return help()
if (!options.root || !options.root.length) options.root = [process.cwd()]
if (!options.wait) options.wait = 1000

var watcher_options = { paths: options.root, filters: {} },
    watcher = new Watcher(watcher_options)

watcher.on('any', debounce(trigger_command, options.wait))

watcher.start()

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

function make_filter(type) {
  var not_array = type === 'file' ? options.notfiles : options.notdirs,
      good_array = type === 'file' ? options.files : options.dirs,
  not_array = (not_array || []).map(regex)
  good_array = (good_array || []).map(regex)

  return function (path) {
    for (var i = 0, l = good_array.length; i < l; ++i) {
      if (compiled[i].test(path)) return true
    }
    for (var i = 0, l = not_array.length; i < l; ++i) {
      if (compiled[i].test(path)) return false
    }
    return true
  }

  function regex(str) {
    return new RegExp(str)
  }
}

function help() {
  console.log('no')
}
