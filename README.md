jung
=====

lightweight, flexible file watching

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
* `--wait, -w <time>` Debounce reaction for `<time>` ms
* `--verbose, -v` Show output from `<command>`
* `--version, -V` Print jung version
* `--help, -h` This thing.

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