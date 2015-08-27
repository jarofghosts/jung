'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var EE = require('events');

var _require = require('child_process');

var spawn = _require.spawn;

var makeEnv = require('./make-environment');

module.exports = processRunner;

function processRunner(_ref) {
  var kill = _ref.kill;
  var command = _ref.command;
  var runfirst = _ref.runfirst;
  var timeout = _ref.timeout;
  var quiet = _ref.quiet;

  var runner = new EE();

  var _command = command = command.split(/\s+/);

  var _command2 = _toArray(_command);

  var bin = _command2[0];

  var args = _command2.slice(1);

  var queue = [];
  var killTimer = undefined;
  var child = undefined;

  if (runfirst) {
    process.nextTick(runCommand);
  }

  runner.close = killChild;
  runner.run = runCommand;

  return runner;

  function runCommand() {
    var filename = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    var env = makeEnv(filename);

    var toRun = [bin, args.map(replaceEnv), { env: env }];

    killOrQueue(toRun);

    function replaceEnv(arg) {
      Object.keys(env).forEach(function (envVar) {
        arg = arg.replace('$' + envVar, env[envVar]);
      });

      return arg;
    }
  }

  function killOrQueue(toRun) {
    if (!kill) {
      runner.emit('queue', toRun);
      queue.push(toRun);
    } else {
      queue = [toRun];
    }

    if (!child) {
      queueNext();

      return;
    }

    killChild();
  }

  function killChild() {
    if (!child) {
      return;
    }

    runner.emit('kill');
    child.kill();

    killTimer = setTimeout(function () {
      runner.emit('terminate');
      child.kill('SIGTERM');
    }, timeout);
  }

  function finish(code) {
    runner.emit('finish', code);

    child = null;

    if (killTimer) {
      clearTimeout(killTimer);
      killTimer = null;
    }

    if (!queue.length) {
      return;
    }

    queueNext();
  }

  function queueNext() {
    var toRun = queue.pop();

    child = spawn.apply(undefined, _toConsumableArray(toRun));

    runner.emit('spawn', toRun);

    if (!quiet) {
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
    }

    child.once('close', finish);
  }
}