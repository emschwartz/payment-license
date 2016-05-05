'use strict'

const fileType = require('file-type')
const Buffer = require('buffer').Buffer
const path = require('path')
const through2 = require('through2')
const licenseUtils = require('./licenseUtils')
const mp3 = require('./mp3')
const mp4 = require('./mp4')

const SUPPORTED_FILETYPES = [
  'mp3',
  'mp4'
]

exports.SUPPORTED_FILETYPES = SUPPORTED_FILETYPES
exports.createLicense = licenseUtils.createLicense
exports.isLicense = licenseUtils.isLicense
exports.parseLicense = licenseUtils.parseLicense
exports.isValidLicense = licenseUtils.isValidLicense
exports.supportsFileType = supportsFiletype
exports.parseLicenseFromFile = parseLicenseFromFile
exports.addLicenseToFile = addLicenseToFile
exports.parseLicenseStream = parseLicenseStream

function supportsFiletype (typeOrBuffer) {
  var type
  if (Buffer.isBuffer(typeOrBuffer)) {
    type = getFileType(typeOrBuffer)
  } else if (typeof typeOrBuffer === 'string') {
    type = typeOrBuffer
  }

  return SUPPORTED_FILETYPES.indexOf(type) !== -1
}

function parseLicenseFromFile (file) {
  const type = getFileType(file)

  switch (type) {
    case 'mp3':
      return mp3.parseLicenseFromFile(file)
    case 'mp4':
      return mp4.parseLicenseFromFile(file)
    default:
      return Promise.reject(new Error('Filetype not supported: ' + type))
  }
}

// Returns a writable stream that will emit the 'license' event or call the
// onLicense function with the license or null if no license is found
function parseLicenseStream (onLicense) {
  var license
  // TODO this method of loading chunks into memory and continuously checking
  // them for a license is inefficient and may run into memory problems
  var buffer = new Buffer(0)

  function checkFoundLicense (parsedLicense) {
    if (parsedLicense && !license) {
      license = parsedLicense
      this.emit('license', license)
      if (typeof onLicense === 'function') {
        onLicense(license)
      }
    }
  }

  return through2(
    function transform (chunk, enc, callback) {
      const _this = this
      if (license) {
        return callback(null, chunk)
      }

      // TODO is it more efficient to grow the buffer each time or to
      // keep an array of chunks and concat the whole array each time?
      buffer = Buffer.concat([buffer, chunk])

      if (!supportsFiletype(buffer)) {
        return callback(null, chunk)
      }

      parseLicenseFromFile(buffer)
        .then(checkFoundLicense.bind(_this))
        .catch(function () {
          // Errors just mean we couldn't read the license from the buffer yet
          // (this could be due to the fact that we haven't loaded all of the tag chunks yet)
          return Promise.resolve()
        })
        .then(function () {
          // Only call the callback after we've checked whether the part of
          // the buffer loaded thus far has the license in it
          callback(null, chunk)
        })

    },
    function flush (callback) {
      if (!license) {
        this.emit('license', null)
        if (typeof onLicense === 'function') {
          onLicense(null)
        }
      }
      callback()
    })
}

function addLicenseToFile (file, licenseDetails, allowOverwrite) {
  var license
  if (typeof licenseDetails === 'string') {
    license = licenseDetails
  } else if (typeof licenseDetails === 'object') {
    license = licenseUtils.createLicense(licenseDetails)
  }

  const type = getFileType(file)
  switch (type) {
    case 'mp3':
      return mp3.addLicenseToFile(file, license, allowOverwrite)
    case 'mp4':
      return mp4.addLicenseToFile(file, license, allowOverwrite)
    default:
      return Promise.reject(new Error('Filetype not supported: ' + type))
  }
}

function getFileType (file) {
  var type
  if (typeof file === 'string') {
    type = path.extname(file)
    if (type.indexOf('.') === 0) {
      type = type.slice(1)
    }
  } else if (Buffer.isBuffer(file)) {
    try {
      type = fileType(file).ext
    } catch (e) {
      type = null
    }
  } else {
    type = null
  }
  return type
}
