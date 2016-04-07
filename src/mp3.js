'use strict'

const id3 = require('id3_reader')
const licenseUtils = require('./licenseUtils')

// TODO figure out if this is the right ordering of the fields
const LICENSE_FIELDS = [
  'payment',
  'copyright_information',
  'comments'
   // TODO maybe could use 'copyright_message' or 'terms_of_use'
]

// TODO add content_hash to license
exports.addLicenseToFile = function addLicenseToFile (file, license, allowOverwrite) {
  return readId3Tags(file)
    .then(function (tags) {
      let wroteLicense = false
      for (let field of LICENSE_FIELDS) {
        if (licenseUtils.isLicense(tags[field])) {
          if (allowOverwrite) {
            tags[field] = license
            wroteLicense = true
            break
          } else {
            throw new Error('File already has license in field: ' + field)
          }
        } else if (!tags[field]) {
          // TODO should we put the license in every field or just the first one?
          tags[field] = license
          wroteLicense = true
          break
        }
      }

      if (!wroteLicense) {
        throw new Error('All potential license fields are already used: ' + LICENSE_FIELDS.join(', '))
      }

      return new Promise(function (resolve, reject) {
        id3.write({
          path: file,
          tags: tags
        }, function (err, data) {
          if (err) {
            return reject(err)
          }
          resolve(data)
        })
      })
    })
}

exports.parseLicenseFromFile = function parseLicenseFromFile (file) {
  return readId3Tags(file)
    .then(function (tags) {
      for (let field of LICENSE_FIELDS) {
        if (licenseUtils.isLicense(tags[field])) {
          return licenseUtils.parseLicense(tags[field])
        }
      }
      return null
    })
}

function readId3Tags (file) {
  return new Promise(function (resolve, reject) {
    id3.read(file, function (err, tags) {
      if (err) {
        return reject(err)
      }
      resolve(tags)
    })
  })
}
