'use strict'

const jsmediatags = require('jsmediatags')
const licenseUtils = require('./licenseUtils')
const fileType = require('file-type')
const shell = require('shelljs')

// TODO figure out if this is the right ordering of the fields
const LICENSE_TAG_FIELDS = [
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
      for (let field of LICENSE_TAG_FIELDS) {
        if (licenseUtils.isLicense(tags[field])) {
          let licenseString = tags[field]
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
      .setTagsToRead(LICENSE_TAG_FIELDS)
      .read({
        onSuccess: function (result) {
          let tags = {}
          for (let tag of LICENSE_TAG_FIELDS) {
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
      let tagToWriteTo
      for (let field of LICENSE_TAG_FIELDS) {
        if (licenseUtils.isLicense(tags[field])) {
          if (allowOverwrite) {
            tagToWriteTo = field
            break
          } else {
            // TODO should we check all of the fields rather than breaking out early?
            throw new Error('File already has license in field: ' + field)
          }
        } else if (!tags[field]) {
          tagToWriteTo = field
          break
        }
      }

      if (!tagToWriteTo) {
        throw new Error('All potential license fields are already used: ' + LICENSE_TAG_FIELDS.join(', '))
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
