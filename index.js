'use strict'

const id3 = require('id3_reader')

const LICENSE_FIELDS = [
  'payment',
  'copyright_information',
  'comments'
   // TODO maybe could use 'copyright_message' or 'terms_of_use'
]
const LICENSE_PREFIX = 'https://interledger.org/licenses/1.0/mpay'

function readId3Tags (pathToFile) {
  return new Promise(function (resolve, reject) {
    id3.read(pathToFile, function (err, tags) {
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

function getLicense (pathToFile) {
  return readId3Tags(pathToFile)
    .then(function (tags) {
      for (let field of LICENSE_FIELDS) {
        if (isLicense(tags[field])) {
          return tags[field]
        }
      }
      throw new Error('No license found')
    })
}

function addLicense (pathToFile, licenseFields) {
  return readId3Tags(pathToFile)
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
          path: pathToFile,
          save_path: pathToFile,
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

const pathToFile = process.argv[2]
if (!pathToFile) {
  console.log('Usage: node index.js <path_to_file>')
  return
}
addLicense(pathToFile, {
  creator_account: 'https://red.ilpdemo.org/ledger/accounts/alice',
  creator_public_key: 'r/MV0THsvdcUAw7Y8x8ca2/dEc8gXRQNDapQ6xFUG3E=', // secret: 9u9KxA3aAQ+9rMZTuXtJjZMOImQwzhHWVGea9oPyqj2v8xXRMey91xQDDtjzHxxrb90RzyBdFA0NqlDrEVQbcQ==
  price_per_minute: '0.0001'
}).then(function (data) {
  return getLicense(pathToFile)
    .then(function (license) {
      console.log('Added license: ' + license)
    })
}).catch(function (err) {
  console.log('Error: ', err.message)
})
