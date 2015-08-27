# jung

[![Build Status](https://img.shields.io/travis/jarofghosts/jung.svg?style=flat-square)](https://travis-ci.org/jarofghosts/jung)
[![npm install](https://img.shields.io/npm/dm/jung.svg?style=flat-square)](https://www.npmjs.org/package/jung)
[![npm version](https://img.shields.io/npm/v/jung.svg?style=flat-square)](https://www.npmjs.org/package/jung)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
[![License](https://img.shields.io/npm/l/jung.svg?style=flat-square)](https://github.com/jarofghosts/jung/blob/master/LICENSE)

lightweight, flexible, file-watching command runner

## installation

`npm install -g jung`

## why

so you can do `jung '*.md' -- cat "$JUNG_FILE" | marked -o "$JUNG_BARENAME.html"`

or

`jung -d /var/log -- echo "$JUNG_FILE changed!"`

or any other variety of neat stuff.

## usage

`jung [glob] [options] -- <command>`

Options are

* `--dir, -d <dir>` Watch files in `<dir>`, default cwd
* `--wait, -w <time>` Debounce reaction for `<time>` ms, default 300
* `--timeout, -t <time>` Wait `<time>` ms after SIGTERM to SIGKILL, default 500
* `--kill, -k` Rather than queueing command runs, kill child process
* `--quiet, -q` Do not show output from `<command>`
* `--runfirst, -R` Run `<command>` at first start
* `--version, -v` Print jung version
* `--help, -h` Print help

Commands are anything you can run in your shell. Including a shell script, for
more complicated things!

## notes

When using jung as part of an npm run script, you will need to escape any `\`
in order to avoid JSON parsing errors.

### example

```js
{
  // ...
  "scripts": {
    "watch-md": "jung *.md -- make html"
  }
  // ...
}
```

When your command is fired, the following environment variables will be
available:

* `$JUNG_FILE` - Full path to file that triggered the command
* `$JUNG_DIR` - The directory the trigger file lives in
* `$JUNG_FILENAME` - Just the filename part of the trigger file
* `$JUNG_EXTENSION` - Just the extension of the trigger file
* `$JUNG_BARENAME` - Trigger filename with no extension

If you run jung with `--runfirst` these environment variables will be blank
strings when the initial execution occurs.

This works really well with scripts, but for one-liners you will need to escape
the `$` to prevent your shell from replacing it too early.

### bad

`jung -- echo $JUNG_FILE did something!`

### good

`jung -- echo WHOA CHECKOUT \$JUNG_FILE` || `jung -- echo 'wee $JUNG_FILE'`

## as a module

```js
const jung = require('jung')

const options = {match: '*.tcl', quiet: true}
const command = 'sh recompile_file.sh $JUNG_FILE'

jung(command, options)
```

## module notes

Options accepts an object of options with keys matching the long form of
any acceptable command line flag.

Any command line flags that do not accept an argument require a boolean value
in the options object and they all default to `false`.

The first argument is the `command` which is a string of the command to be run.

## license

MIT
