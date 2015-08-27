'use strict';

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var path = require('path');
var fs = require('fs');

var minimist = require('minimist');

var jung = require('../');
var pkg = require('../../package.json');

module.exports = bin;

if (module === require.main) {
  bin();
}

function bin() {
  var ps = arguments.length <= 0 || arguments[0] === undefined ? process : arguments[0];

  var options = minimist(ps.argv.slice(2), {
    '--': true,
    'alias': {
      runfirst: 'R',
      version: 'v',
      help: 'h',
      quiet: 'q',
      kill: 'k',
      timeout: 't',
      wait: 'w',
      dir: 'd'
    }
  });

  if (options._.length !== 0) {
    options.match = options._[0];
  }

  if (options.help || options['--'].length === 0) {
    help();

    return;
  }

  if (options.version) {
    version();

    return;
  }

  var runner = jung(options['--'].join(' '), options);

  if (!options.quiet) {
    runner.on('spawn', logSpawn).on('queue', logQueue).on('kill', logKill).on('finish', logFinish).on('terminate', logTerminate);
  }

  function logSpawn(_ref) {
    var _ref2 = _toArray(_ref);

    var bin = _ref2[0];

    var args = _ref2.slice(1);

    log('running ' + bin + ' ' + args.join(' '));
  }

  function logKill() {
    log('killing...');
  }

  function logQueue(_ref3) {
    var _ref32 = _toArray(_ref3);

    var bin = _ref32[0];

    var args = _ref32.slice(1);

    log('queueing ' + bin + ' ' + args.join(' '));
  }

  function logTerminate() {
    log('took to long to kill, TERMINATING');
  }

  function logFinish(code) {
    if (code !== 0) {
      log('command exited with non-zero code');
    }
  }

  function log(str) {
    ps.stderr.write(str + '\n');
  }

  function help() {
    version();

    fs.createReadStream(path.join(__dirname, '..', '..', 'help.txt')).pipe(ps.stderr);
  }

  function version() {
    log('jung version ' + pkg.version);
  }
}