#!/usr/bin/env node

var watch = require('fs-watch').Watcher,
    nopt = require('nopt'),
    path = require('path'),
    spawn = require('child_process').spawn,
    debounce = require('lodash.debounce'),
    options = { dir: String, filetype: String },
    command,
    watcher

watcher = new Watcher({ paths: path.resolve(dir),
  filters: {
    includeFile: function (name) {
      return /\.js$/.test(name)
    }
  }
})

watcher.on('any', debounce(trigger_command))

watcher.start()
