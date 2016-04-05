'use strict'

const fileType = require('file-type')
const Buffer = require('buffer').Buffer
const licenseUtils = require('./licenseUtils')
const mp3 = require('./mp3')

exports.createLicense = licenseUtils.createLicense
exports.isLicense = licenseUtils.isLicense
exports.parseLicense = licenseUtils.parseLicense

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

exports.addLicenseToFile = function addLicenseToFile (file, licenseDetails) {
  let license
  if (typeof licenseDetails === 'string') {
    license = licenseDetails
  } else if (typeof licenseDetails === 'object') {
    license = licenseUtils.createLicense(licenseDetails)
  }

  const type = getFileType(file)
  switch (type) {
    case 'mp3':
      return mp3.addLicenseToFile(file, license)
    default:
      return Promise.reject(new Error('Filetype not supported: ' + type))
  }
}

function getFileType (file) {
  try {
    return fileType(file).ext
  } catch (e) { }
  return null
}
