const path = require('path')

module.exports = makeEnvironment

function makeEnvironment (filename) {
  return {
    JUNG_FILE: filename,
    JUNG_FILENAME: path.basename(filename),
    JUNG_EXTENSION: path.extname(filename),
    JUNG_DIR: path.dirname(filename),
    JUNG_BARENAME: path.basename(filename).slice(
      0,
      -path.extname(filename).length
    )
  }
}
