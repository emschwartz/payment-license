'use strict'

const fileType = require('file-type')
const Buffer = require('buffer').Buffer
const path = require('path')
const licenseUtils = require('./licenseUtils')
const mp3 = require('./mp3')

exports.createLicense = licenseUtils.createLicense
exports.isLicense = licenseUtils.isLicense
exports.parseLicense = licenseUtils.parseLicense
exports.isValidLicense = licenseUtils.isValidLicense

exports.SUPPORTED_FILETYPES = [
  'mp3'
]

exports.supportsFileType = function supportsFiletype (typeOrBuffer) {
  let type
  if (Buffer.isBuffer(typeOrBuffer)) {
    type = getFileType(typeOrBuffer)
  } else if (typeof typeOrBuffer === 'string') {
    type = typeOrBuffer
  }

  return exports.SUPPORTED_FILETYPES.indexOf(type) !== -1
}

exports.parseLicenseFromFile = function parseLicenseFromFile (file) {
  const type = getFileType(file)

  switch (type) {
    case 'mp3':
      return mp3.parseLicenseFromFile(file)
    default:
      return Promise.reject(new Error('Filetype not supported: ' + type))
  }
}

exports.addLicenseToFile = function addLicenseToFile (file, licenseDetails, allowOverwrite) {
  let license
  if (typeof licenseDetails === 'string') {
    license = licenseDetails
  } else if (typeof licenseDetails === 'object') {
    license = licenseUtils.createLicense(licenseDetails)
  }

  const type = getFileType(file)
  switch (type) {
    case 'mp3':
      return mp3.addLicenseToFile(file, license, allowOverwrite)
    default:
      return Promise.reject(new Error('Filetype not supported: ' + type))
  }
}

function getFileType (file) {
  let type
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
