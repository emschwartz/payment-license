'use strict'

const querystring = require('querystring')

const LICENSE_PREFIX = 'https://interledger.org/licenses/1.0/mpay?'
exports.LICENSE_PREFIX = LICENSE_PREFIX

exports.createLicense = function createLicense (params) {
  // TODO should the license be a string, JSON, something else?
  let license = exports.LICENSE_PREFIX
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
  return querystring.parse(licenseParamsString)
}
