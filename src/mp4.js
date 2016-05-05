'use strict'

const jsmediatags = require('jsmediatags')
const licenseUtils = require('./licenseUtils')
const fileType = require('file-type')
const shell = require('shelljs')

// This is needed for browserifying this module because the tmp module uses
// process.versions.node, which is undefined in the browser
var tmp
try {
  tmp = require('tmp')
} catch (e) {}

const LICENSE_TAGS = [
  '©cpy', // copyright
  // 'cprt', // other copyright tag
  '©cmt', // comments
  'desc' // description
]

// ffmpeg uses different names than jsmediatags
const WRITE_TAG_MAPPING = {
  '©cpy': 'copyright',
  '©cmt': 'comment',
  'desc': 'description'
}

exports.parseLicenseFromFile = parseLicenseFromFile
if (typeof window !== 'object') {
  exports.addLicenseToFile = addLicenseToFile
} else {
  exports.addLicenseToFile = function () {
    throw new Error('addLicenseToFile is not supported in the browser')
  }
}

function parseLicenseFromFile (file) {
  if (!(typeof file === 'string' ||
      Buffer.isBuffer(file) ||
      (typeof File === 'function' && file instanceof File))) {
    return Promise.reject('Invalid file passed to parseLicenseFromFile')
  }
  return readTags(file)
    .then(function (tags) {
      for (var t = 0; t < LICENSE_TAGS.length; t++) {
        var tag = LICENSE_TAGS[t]
        if (licenseUtils.isLicense(tags[tag])) {
          var licenseString = tags[tag]
          if (licenseString.lastIndexOf('\0') === licenseString.length - 1) {
            licenseString = licenseString.slice(0, licenseString.length - 1)
          }
          return licenseUtils.parseLicense(licenseString)
        }
      }
      return null
    })
}

function readTags (file) {
  return new Promise(function (resolve, reject) {
    new jsmediatags.Reader(file)
      .setTagsToRead(LICENSE_TAGS)
      .read({
        onSuccess: function (result) {
          var tags = {}
          for (var tag of LICENSE_TAGS) {
            if (result.tags[tag]) {
              tags[tag] = result.tags[tag].data
            }
          }
          resolve(tags)
        },
        onError: function (err) {
          reject(new Error(err.info))
        }
      })
  })
}

// TODO add content_hash to license
function addLicenseToFile (filePath, license, allowOverwrite) {
  if (typeof filePath !== 'string') {
    return Promise.reject(new Error('filePath must be a string'))
  }

  return readTags(filePath)
    .then(function (tags) {
      var tagToWriteTo
      for (var t = 0; t < LICENSE_TAGS.length; t++) {
        var tag = LICENSE_TAGS[t]
        if (licenseUtils.isLicense(tags[tag])) {
          if (allowOverwrite) {
            tagToWriteTo = tag
            break
          } else {
            // TODO should we check all of the tags rather than breaking out early?
            throw new Error('File already has license in tag: ' + tag)
          }
        } else if (!tags[tag]) {
          tagToWriteTo = tag
          break
        }
      }

      if (!tagToWriteTo) {
        throw new Error('All potential license tags are already used: ' + LICENSE_TAGS.join(', '))
      }

      return writeTag(filePath, tagToWriteTo, license)
        .then(function () {
          return license
        })
    })
}

function writeTag (filePath, tag, value) {
  if (!shell.which('ffmpeg')) {
    return Promise.reject(new Error('ffmpeg must be installed to write mp3 tags!'))
  }

  // Convert jsmediatags name to ffmpeg name
  const ffmpegTag = WRITE_TAG_MAPPING[tag]

  return new Promise(function (resolve, reject) {
    // Create a temporary file to write to
    // (This is necessary because ffmpeg cannot read and write from the same file)
    tmp.tmpName({ postfix: '.mp4' }, function (err, path) {
      if (err) {
        return reject(err)
      }
      resolve(path)
    })
  })
  .then(function (tempFile) {
    // Copy file to temporary file
    return new Promise(function (resolve, reject) {
      shell.exec('ffmpeg -y -i ' + filePath + ' -codec copy -metadata ' + ffmpegTag + '="' + value + '" ' + tempFile, {
        async: true,
        silent: true
      }, function (code, stdout, stderr) {
        if (code > 0) {
          return reject(new Error('Error writing tags: ' + stderr))
        }
        resolve(tempFile)
      })
    })
  })
  .then(function (tempFile) {
    if (!shell.test('-e', tempFile)) {
      throw new Error('ffmpeg did not write to the temporary file!')
    }
    shell.mv('-f', tempFile, filePath)
  })
}
