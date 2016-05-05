'use strict'

const jsmediatags = require('jsmediatags')
const licenseUtils = require('./licenseUtils')
const fileType = require('file-type')
const shell = require('shelljs')

// TODO figure out if this is the right ordering of the tags
const LICENSE_TAGS = [
  'WPAY', // payment
  'WCOP', // copyright information
  'TCOP', // copyright message
  'COMM' // comments
]

exports.parseLicenseFromFile = parseLicenseFromFile
if (typeof window !== 'object') {
  exports.addLicenseToFile = addLicenseToFile
} else {
  exports.addLicenseToFile = function () {
    throw new Error('addLicenseToFile is not supported in the browser')
  }
}

function parseLicenseFromFile (file) {
  if (!(typeof file === 'string' ||
      Buffer.isBuffer(file) ||
      (typeof File === 'function' && file instanceof File))) {
    return Promise.reject('Invalid file passed to parseLicenseFromFile')
  }
  return readTags(file)
    .then(function (tags) {
      for (var t = 0; t < LICENSE_TAGS.length; t++) {
        var tag = LICENSE_TAGS[t]
        if (licenseUtils.isLicense(tags[tag])) {
          var licenseString = tags[tag]
          if (licenseString.lastIndexOf('\0') === licenseString.length - 1) {
            licenseString = licenseString.slice(0, licenseString.length - 1)
          }
          return licenseUtils.parseLicense(licenseString)
        }
      }
      return null
    })
}

function readTags (file) {
  return new Promise(function (resolve, reject) {
    new jsmediatags.Reader(file)
      .setTagsToRead(LICENSE_TAGS)
      .read({
        onSuccess: function (result) {
          var tags = {}
          for (var t = 0; t < LICENSE_TAGS.length; t++) {
            var tag = LICENSE_TAGS[t]
            if (result.tags[tag]) {
              tags[tag] = cleanTag(result.tags[tag].data)
            }
          }
          resolve(tags)
        },
        onError: function (err) {
          reject(new Error(err.info))
        }
      })
  })
}

function cleanTag (string) {
  // When the license is written as a unicode string id3js returns it as [u'...']
  if (string && string.indexOf('[u\'') === 0) {
    return string.slice(3, string.length - 2)
  } else {
    return string
  }
}

// TODO add content_hash to license
function addLicenseToFile (filePath, license, allowOverwrite) {
  if (typeof filePath !== 'string') {
    return Promise.reject(new Error('filePath must be a string'))
  }

  return readTags(filePath)
    .then(function (tags) {
      var tagToWriteTo
      for (var t = 0; t < LICENSE_TAGS.length; t++) {
        var tag = LICENSE_TAGS[t]
        if (licenseUtils.isLicense(tags[tag])) {
          if (allowOverwrite) {
            tagToWriteTo = tag
            break
          } else {
            // TODO should we check all of the tags rather than breaking out early?
            throw new Error('File already has license in tag: ' + tag)
          }
        } else if (!tags[tag]) {
          tagToWriteTo = tag
          break
        }
      }

      if (!tagToWriteTo) {
        throw new Error('All potential license tags are already used: ' + LICENSE_TAGS.join(', '))
      }

      return writeTag(filePath, tagToWriteTo, license)
    })
}

function writeTag (filePath, tag, value) {
  // The COMM tag uses colons in its format so we need to escape it before writing it
  if (tag === 'COMM') {
    value = value.replace(/[:]/g, '\\:')
  }
  if (shell.which('mid3v2')) {
    return new Promise(function (resolve, reject) {
      shell.exec('mid3v2 -e --' + tag + ' "' + value + '" ' + filePath, {
        async: true,
        silent: true
      }, function (code, stdout, stderr) {
        if (code > 0) {
          return reject(new Error('Error writing tags: ' + stderr))
        }
        resolve(stdout)
      })
    })
  } else {
    return Promise.reject(new Error('mid3v2 (mutagen) must be installed to write mp3 tags!'))
  }
  // TODO add support for eyeD3 or other libs
}
