'use strict'

const id3 = require('id3_reader')

// TODO figure out if this is the right ordering of the fields
const LICENSE_FIELDS = [
  'payment',
  'copyright_information',
  'comments'
   // TODO maybe could use 'copyright_message' or 'terms_of_use'
]
const LICENSE_PREFIX = 'https://interledger.org/licenses/1.0/mpay'

exports.parseLicense = function parseLicense (file) {
  return readId3Tags(file)
    .then(function (tags) {
      for (let field of LICENSE_FIELDS) {
        if (isLicense(tags[field])) {
          return tags[field]
        }
      }
      throw new Error('No license found')
    })
}

exports.addToFile = function addToFile (file, licenseFields) {
  return readId3Tags(file)
    .then(function (tags) {
      return new Promise(function (resolve, reject) {
        const license = createLicense(licenseFields)
        let wroteLicense = false
        for (let field of LICENSE_FIELDS) {
          if (tags[field] && isLicense(tags[field])) {
            return reject(new Error('File already has license!'))
          } else if (!tags[field]) {
            // TODO should we put the license in every field or just the first one?
            tags[field] = license
            wroteLicense = true
            break
          }
        }

        if (!wroteLicense) {
          return reject(new Error('All potential license fields are already used: ' + LICENSE_FIELDS.join(', ')))
        }

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

function isLicense (string) {
  return string.indexOf(LICENSE_PREFIX) === 0
}

function createLicense (params) {
  // TODO should the license be a string, JSON, something else?
  let license = LICENSE_PREFIX + '?'
  Object.keys(params).forEach(function (key, index) {
    if (index > 0) {
      license += '&'
    }
    license += key + '=' + params[key]
  })

  return license
}
