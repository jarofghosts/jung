jung
=====

lightweight, flexible file watching

## why

so you can do `jung -f '\.js$' -- browserify main.js -o bundle.js`

or

`jung -f '\.md' -- cat $JUNG_FILE | marked -o $JUNG_FILE.html`

or

`jung -r /var/log -- echo $JUNG_FILE changed!`

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

## license

MIT
