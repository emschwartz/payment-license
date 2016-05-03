'use strict'

const jsmediatags = require('jsmediatags')
const licenseUtils = require('./licenseUtils')
const fileType = require('file-type')
const shell = require('shelljs')

const LICENSE_TAG_FIELDS = [
  'cprt', // copyright information
  '©cpy', // copyright message
  '©cmt', // comments
  'desc' // description
]

exports.parseLicenseFromFile = parseLicenseFromFile

function parseLicenseFromFile (file) {
  if (!(typeof file === 'string' ||
      Buffer.isBuffer(file) ||
      (typeof File === 'function' && file instanceof File))) {
    return Promise.reject('Invalid file passed to parseLicenseFromFile')
  }
  return readId3Tags(file)
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

function readId3Tags (file) {
  return new Promise(function (resolve, reject) {
    new jsmediatags.Reader(file)
      .setTagsToRead(LICENSE_TAG_FIELDS)
      .read({
        onSuccess: function (result) {
          let tags = {}
          for (let tag of LICENSE_TAG_FIELDS) {
            if (result.tags[tag]) {
              tags[tag] = result.tags[tag].data
            }
          }
          resolve(tags)
        },
        onError: function (err) {
          reject(err)
        }
      })
  })
}
