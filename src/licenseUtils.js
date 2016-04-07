'use strict'

const querystring = require('querystring')

const LICENSE_TYPE = 'https://interledger.org/licenses/1.0/mpay'
const LICENSE_PREFIX = LICENSE_TYPE + '?'

exports.createLicense = function createLicense (params) {
  // TODO should the license be a string, JSON, something else?
  let license = LICENSE_PREFIX
  Object.keys(params).forEach(function (key, index) {
    if (index > 0) {
      license += '&'
    }
    license += key + '=' + params[key]
  })

  return license
}

exports.isLicense = function isLicense (string) {
  return string && string.indexOf(LICENSE_PREFIX) === 0
}

exports.parseLicense = function parseLicense (string) {
  const licenseParamsString = string.slice(LICENSE_PREFIX.length)
  let parsed = querystring.parse(licenseParamsString)
  parsed.license_type = LICENSE_TYPE
  return parsed
}

exports.isValidLicense = function isValidLicense (license, now) {
  let licenseParams = (typeof license === 'string' ? parseLicense(license) : license)
  // TODO check expiry
  // TODO check signature against public key
  return licenseParams.hasOwnProperty('signature')
}