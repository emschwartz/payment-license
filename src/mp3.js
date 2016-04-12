'use strict'

const jsmediatags = require('jsmediatags')
const id3Writer = require('id3-writer')
const licenseUtils = require('./licenseUtils')
const File = (typeof window === 'object' ? window.File : require('file-api').File)
const fileType = require('file-type')

// TODO figure out if this is the right ordering of the fields
const LICENSE_TAG_FIELDS = [
  // TODO COMM shouldn' tbe the only supported tag but right now id3-writer doesn't support the others
  // 'WPAY', // payment
  // 'WCOP', // copyright information
  // 'TCOP', // copyright message
  'COMM' // comments
]

exports.parseLicenseFromFile = parseLicenseFromFile
if (typeof window !== 'object') {
  exports.addLicenseToFile = addLicenseToFile
} else {
  exports.addLicenseToFile = function () {
    throw new Error('addLicenseToFile is not supported in the browser')
  }
}

// TODO add content_hash to license
function addLicenseToFile (filePath, license, allowOverwrite) {
  if (typeof filePath !== 'string') {
    return Promise.reject(new Error('filePath must be a string'))
  }

  return readId3Tags(filePath)
    .then(function (tags) {
      let tagToWriteTo
      for (let field of LICENSE_TAG_FIELDS) {
        if (licenseUtils.isLicense(tags[field])) {
          if (allowOverwrite) {
            tagToWriteTo = field
            break
          } else {
            // TODO should we check all of the fields rather than breaking out early?
            throw new Error('File already has license in field: ' + field)
          }
        } else if (!tags[field]) {
          tagToWriteTo = field
          break
        }
      }

      console.log(tagToWriteTo)

      if (!tagToWriteTo) {
        throw new Error('All potential license fields are already used: ' + LICENSE_TAG_FIELDS.join(', '))
      }

      return new Promise(function (resolve, reject) {
        const writer = new id3Writer.Writer({
          clear: false
        })
        const file = new id3Writer.File(filePath)
        const meta = new id3Writer.Meta({
          // TODO make id3-writer support writing other tags
          comment: license
        })

        writer.setFile(file).write(meta, function (err) {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })
    })
}

function parseLicenseFromFile (input) {
  let file
  if (typeof input === 'string' || input instanceof File || (typeof window === 'object' && input instanceof window.Blob)) {
    file = input
  } else if (Buffer.isBuffer(input)) {
    file = new File({
      name: 'doesn\t matter anyway, we\'re just reading',
      type: fileType(input).type,
      buffer: input
    })
  } else {
    return Promise.reject('Invalid file passed to parseLicenseFromFile')
  }
  return readId3Tags(file)
    .then(function (tags) {
      for (let field of LICENSE_TAG_FIELDS) {
        if (licenseUtils.isLicense(tags[field])) {
          return licenseUtils.parseLicense(tags[field])
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
          for (let field of LICENSE_TAG_FIELDS) {
            if (result.tags[field] && result.tags[field].data) {
              if (typeof result.tags[field].data === 'string') {
                tags[field] = result.tags[field].data
              } else if (typeof result.tags[field].data === 'object' && result.tags[field].data.text) {
                tags[field] = result.tags[field].data.text
              }
            }
          }
          resolve(tags)
        },
        onError: function (err) {
          reject(new Error(err.info || err))
        }
      })
  })
}
