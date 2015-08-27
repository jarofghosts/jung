'use strict';

require('babel/polyfill');

var EE = require('events');
var path = require('path');

var chokidar = require('chokidar');
var debounce = require('just-debounce');

var processRunner = require('./process-runner');

module.exports = jung;

var CWD = process.cwd();
var EVENTS = new Set(['spawn', 'finish', 'kill', 'queue', 'terminate']);

function jung(command) {
  var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var _ref$dir = _ref.dir;
  var dir = _ref$dir === undefined ? CWD : _ref$dir;
  var _ref$wait = _ref.wait;
  var wait = _ref$wait === undefined ? 300 : _ref$wait;
  var _ref$timeout = _ref.timeout;
  var timeout = _ref$timeout === undefined ? 500 : _ref$timeout;
  var _ref$match = _ref.match;
  var match = _ref$match === undefined ? '*' : _ref$match;
  var _ref$kill = _ref.kill;
  var kill = _ref$kill === undefined ? false : _ref$kill;
  var _ref$quiet = _ref.quiet;
  var quiet = _ref$quiet === undefined ? false : _ref$quiet;
  var _ref$runfirst = _ref.runfirst;
  var runfirst = _ref$runfirst === undefined ? false : _ref$runfirst;

  var runner = processRunner({ kill: kill, command: command, runfirst: runfirst, timeout: timeout, quiet: quiet });
  var watcher = chokidar.watch(match, { ignored: '.git/**/*', cwd: dir, ignoreInitial: true });
  var ee = new EE();

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = EVENTS[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _event = _step.value;

      runner.on(_event, ee.emit.bind(_event));
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  watcher.on('all', debounce(function (event, filename) {
    runner.run(path.join(dir, filename));
  }, wait, true));

  ee.close = close;

  return ee;

  function close() {
    runner.close();
    watcher.close();
  }
}