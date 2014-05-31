#!/usr/bin/env node

var Jung = require('../').Jung
  , nopt = require('nopt')
  , fs = require('fs')
  , path = require('path')
  , color = require('bash-color')
  , jung = require('../package.json')

var noptions = {
    root: Array
  , files: Array
  , dirs: Array
  , notfiles: Array
  , notdirs: Array
  , wait: Number
  , run: Boolean
  , timeout: Number
  , kill: Boolean
  , quiet: Boolean
  , help: Boolean
  , version: Boolean
}
var shorts = {
    r: ['--root']
  , R: ['--run']
  , d: ['--dirs']
  , f: ['--files']
  , w: ['--wait']
  , t: ['--timeout']
  , D: ['--notdirs']
  , F: ['--notfiles']
  , q: ['--quiet']
  , k: ['--kill']
  , h: ['--help']
  , v: ['--version']
}

var options = nopt(noptions, shorts, process.argv)
  , command_pos = process.argv.indexOf('--') + 1

if(options.version) return version()
if(options.help || !command_pos) return help()

var command = process.argv.slice(command_pos)

options.names = (nopt(
    noptions
  , shorts
  , process.argv.slice(0, process.argv.indexOf('--'))
).argv.remain || []).map(resolve)

return new Jung(options, command).start()

function version() {
  return process.stdout.write(
      color.yellow('jung version ' + jung.version) + '\n'
  )
}

function help() {
  version()
  return fs.createReadStream(path.join(__dirname, '../help.txt'))
    .pipe(process.stderr)
}

function resolve(name) {
  return path.resolve(name)
}
