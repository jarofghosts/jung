jung
=====

[![Build Status](https://travis-ci.org/jarofghosts/jung.png?branch=master)](https://travis-ci.org/jarofghosts/jung)

lightweight, flexible, file-watching command runner

## installation

`npm install -g jung`

## why

so you can do `jung -f '\.js$' -- browserify main.js -o bundle.js`

or

`jung -f '\.md$' -- cat \$JUNG_FILE | marked -o \$JUNG_FILE.html`

or

`jung -r /var/log -- echo \$JUNG_FILE changed!`

or any other variety of neat stuff.

## usage

`jung [options] -- <command>`

Options are

* `--root, -r <dir>` Watch files in `<dir>`, default cwd
* `--dirs, -d <regex>` Only watch sub directories matching `<regex>`
* `--notdirs, -D <regex>` Ignore sub directories matching `<regex>`
* `--files, -f <regex>` Only watch files matching `<regex>`
* `--notfiles, -F <regex>` Ignore files matching `<regex>`
* `--wait, -w <time>` Debounce reaction for `<time>` ms, default 1000
* `--kill, -k` Rather than queueing command runs, kill child process
* `--quiet, -q` Do not show output from `<command>`
* `--version, -v` Print jung version
* `--help, -h` This thing.

Commands are anything you can run in your shell. Including a shell script, for
more complicated things!

## notes

When your command is fired, `$JUNG_FILE` will be available as an environment
variable containing the full path to the file that triggered the command. This
works really well with scripts, but for one-liners you will need to escape the
`$` to prevent your shell from replacing it too early.

### bad

`jung -- echo $JUNG_FILE did something!`

### good

`jung -- echo WHOA CHECK OUT \$JUNG_FILE`

## license

MIT
