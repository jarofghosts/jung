#!/usr/bin/env node

var Jung = require('../').Jung,
    nopt = require('nopt'),
    noptions = {
      root: Array,
      files: Array,
      dirs: Array,
      notfiles: Array,
      notdirs: Array,
      wait: Number,
      kill: Boolean,
      quiet: Boolean,
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
      q: ['--quiet'],
      k: ['--kill'],
      h: ['--help'],
      v: ['--version']
    },
  options = nopt(noptions, shorts, process.argv),
  command = options.argv.remain

if (options.version) return Jung().version()
if (!command.length || options.help) return Jung().help()

return new Jung(options, command).start()
