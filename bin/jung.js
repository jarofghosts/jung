#!/usr/bin/env node

var path = require('path')
  , fs = require('fs')

var color = require('bash-color')
  , nopt = require('nopt')

var jung = require('../package.json')
  , Jung = require('../')

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
  , commandPos = process.argv.indexOf('--') + 1

if(options.version) return version()
if(options.help || !commandPos) return help()

var command = process.argv.slice(commandPos)

options.names = (nopt(
    noptions
  , shorts
  , process.argv.slice(0, process.argv.indexOf('--'))
).argv.remain || []).map(resolve)

var jungInstance = Jung(options, command)

jungInstance.start()

if(!options.quiet) {
  jungInstance.on('error', displayError)
  jungInstance.on('killing', displayKill)
  jungInstance.on('queueing', displayQueue)
  jungInstance.on('running', displayRun)
  jungInstance.on('ran', displayRan)
  jungInstance.on('started', displayListening)
}

function displayListening() {
  process.stdout.write(color.yellow('jung is listening') + '\n')
}

function displayRun(command) {
  process.stdout.write(color.green('** Running `' + command + '`') + '\n')
}

function displayKill() {
  process.stdout.write(color.red('** Killing old process') + '\n')
}

function displayQueue() {
  process.stdout.write(color.blue('-- Queueing new process') + '\n')
}

function displayRan(command, code) {
  if(!code) return
  process.stderr.write(color.red('@@ Command exited with code ' + code) + '\n')
}

function displayError(error) {
  process.stderr.write(color.red(error.message) + '\n')
}

function version() {
  return process.stdout.write(
      color.yellow('jung version ' + jung.version) + '\n'
  )
}

function help() {
  version()
  return fs.createReadStream(path.join(__dirname, '..', 'help.txt'))
    .pipe(process.stderr)
}

function resolve(name) {
  return path.resolve(name)
}
