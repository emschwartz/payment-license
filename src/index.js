'use strict'

const fileType = require('file-type')
const Buffer = require('buffer').Buffer
const path = require('path')
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

function supportsFiletype (typeOrBuffer) {
  let type
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

function addLicenseToFile (file, licenseDetails, allowOverwrite) {
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
    case 'mp4':
      return mp4.addLicenseToFile(file, license, allowOverwrite)
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
