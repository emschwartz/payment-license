#!/usr/bin/env node
'use strict'

const paymentLicense = require('../')
const path = require('path')
const inquirer = require('inquirer')
const program = require('commander')
const WebFinger = require('webfinger.js')

// TODO allow directories
let partialFilePath
program
  // .version('1.0.0')
  .usage('[options] [file]')
  .description('Command line tool for generating and parsing payment licenses')
  .option('--read', 'parse license from file')
  .option('--overwrite', 'Overwrite existing file license')
  .arguments('[file]')
  .action(function (file) {
    partialFilePath = file
  })
  .on('--help', function () {
    console.log('  Examples:')
    console.log('')
    console.log('    $ payment-license                            Runs the license creator tool and prints the output')
    console.log('    $ payment-license ./path/to/song.mp3         Runs the license creator and attaches license to file')
    console.log('    $ payment-license --read ./path/to/song.mp3  Parse the license from the file')
    console.log('')
  })
  .parse(process.argv)

if (partialFilePath) {
  const filePath = path.resolve(process.cwd(), partialFilePath)
  if (program.read) {
    paymentLicense.parseLicenseFromFile(filePath)
      .then(function (license) {
        console.log(license)
      })
      .catch(function (err) {
        console.log('Error parsing license from file ' + filePath, err)
      })
  } else {
    runLicenseCreatorTool(filePath, program.overwrite)
  }
} else {
  runLicenseCreatorTool()
}

function promptForLicenseDetails () {
  console.log('Welcome to the payment-license creator tool')
  const prompts = [{
    type: 'input',
    name: 'creator_account',
    // TODO accept alice@red.ilpdemo.org form
    message: 'ILP account address to receive payments (e.g. alice@red.ilpdemo.org):',
    // TODO get rid of defaults
    default: 'alice@red.ilpdemo.org'
  }, {
    type: 'input',
    name: 'creator_public_key',
    message: 'Ed25519 public key to sign receipts with:',
    default: 'r/MV0THsvdcUAw7Y8x8ca2/dEc8gXRQNDapQ6xFUG3E=' // secret: 9u9KxA3aAQ+9rMZTuXtJjZMOImQwzhHWVGea9oPyqj2v8xXRMey91xQDDtjzHxxrb90RzyBdFA0NqlDrEVQbcQ==
  }, {
    type: 'input',
    name: 'price_per_minute',
    message: 'Price per minute to charge for license:',
    default: '0.0001'
  }]

  return new Promise(function (resolve, reject) {
    inquirer.prompt(prompts, resolve)
  })
}

function webfingerAddress (address) {
  const webfinger = new WebFinger()
  return new Promise((resolve, reject) => {
    webfinger.lookup(address, (err, res) => {
      if (err) {
        return reject(new Error('Error looking up wallet address: ' + err.message))
      }

      let webFingerDetails = {}
      try {
        for (let link of res.object.links) {
          if (link.rel === 'http://webfinger.net/rel/ledgerAccount') {
            webFingerDetails.account = link.href
          } else if (link.rel === 'http://webfinger.net/rel/socketIOUri') {
            webFingerDetails.socketIOUri = link.href
          }
        }
      } catch (err) {
        return reject(new Error('Error parsing webfinger response' + err.message))
      }
      resolve(webFingerDetails)
    })
  })
}

function runLicenseCreatorTool (file, allowOverwrite) {
  // TODO validate input
  promptForLicenseDetails()
    .then(function (params) {
      if (params.creator_account && params.creator_account.indexOf('@') !== -1) {
        return webfingerAddress(params.creator_account)
          .then((webFingerDetails) => {
            params.creator_account = webFingerDetails.account
            return params
          })
      } else {
        return Promise.resolve(params)
      }
    })
    .then(function (params) {
      if (file) {
        paymentLicense.addLicenseToFile(file, {
          creator_account: params.creator_account,
          creator_public_key: params.creator_public_key,
          price_per_minute: params.price_per_minute
        }, allowOverwrite)
        .then(function () {
          return paymentLicense.parseLicenseFromFile(file)
            .then(function (license) {
              console.log('Added license:', license)
            })
        })
        .catch(function (err) {
          console.error('Error: ' + err.stack || err.message || err)
        })
      } else {
        console.log(paymentLicense.createLicense(params))
      }
    })
}
