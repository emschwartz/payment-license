'use strict'

const id3js = require('id3js')
const licenseUtils = require('./licenseUtils')
const File = (typeof window === 'object' ? window.File : require('file-api').File)
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

// TODO add content_hash to license
function addLicenseToFile (filePath, license, allowOverwrite) {
  if (typeof filePath !== 'string') {
    return Promise.reject(new Error('filePath must be a string'))
  }

  return readId3Tags(filePath)
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

function parseLicenseFromFile (input) {
  let file
  if (typeof input === 'string' || input instanceof File || (typeof window === 'object' && input instanceof window.Blob)) {
    file = input
  } else if (Buffer.isBuffer(input)) {
    file = new File({
      name: 'doesn\t matter anyway, we\'re just reading',
      type: fileType(input).type,
      buffer: input
    })
  } else {
    return Promise.reject('Invalid file passed to parseLicenseFromFile')
  }
  return readId3Tags(file)
    .then(function (tags) {
      for (let field of LICENSE_TAG_FIELDS) {
        if (licenseUtils.isLicense(tags[field])) {
          return licenseUtils.parseLicense(tags[field])
        }
      }
      return null
    })
}

function readId3Tags (file) {
  let arg
  if (typeof file === 'string') {
    arg = { file: file, type: id3js.OPEN_LOCAL }
  } else if (file instanceof File) {
    arg = file
  }

  return new Promise(function (resolve, reject) {
    id3js(arg , function (err, tags) {
      if (err) {
        return reject(err)
      }

      resolve({
        WPAY: tags.v2['url-payment'],
        WCOP: tags.v2['url-legal'],
        TCOP: tags.v2.copyright,
        COMM: tags.v2.comments
      })
    })
  })
}

function writeTag (filePath, tag, value) {
  // TODO @tomorrow make sure the value matches the string spec if it's for a COMM tag
  if (shell.which('mid3v2')) {
    return new Promise(function (resolve, reject) {
      shell.exec('mid3v2 --' + tag + ' "' + value + '" ' + filePath, {
        async: true,
        silent: true
      }, function (code, stdout, stderr) {
        if (code > 0) {
          return reject(new Error(stderr))
        }
        resolve(stdout)
      })
    })
  } else {
    return Promise.reject(new Error('No tag writer found!'))
  }
  // TODO add support for eyeD3 or other libs
}
