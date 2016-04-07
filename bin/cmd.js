#!/usr/bin/env node

var paymentLicense = require('../')
var fs = require('fs')
var path = require('path')
var inquirer = require('inquirer')
var program = require('commander')

// TODO allow directories
var partialFilePath
program
  .version('1.0.0')
  .usage('[options] [file]')
  .option('--read', 'Parse license from file')
  .option('--overwrite', 'Overwrite existing file license')
  .arguments('[file]')
  .action(function (file) {
    partialFilePath = file
  })
  .parse(process.argv)

if (partialFilePath) {
  var filePath = path.resolve(process.cwd(), partialFilePath)
  var file = fs.readFileSync(filePath)
  if (program.read) {
    paymentLicense.parseLicenseFromFile(file)
      .then(function (license) {
        console.log(license)
      })
      .catch(function (err) {
        console.log('Error parsing license from file ' + filePath, err)
      })
  } else {
    runLicenseCreatorTool(file, program.overwrite)
  }
} else {
  runLicenseCreatorTool()
}

function runLicenseCreatorTool (file, allowOverwrite) {
  // TODO validate input
  console.log('Welcome to the payment-license creator tool')
  var prompts = [{
    type: 'input',
    name: 'creator_account',
    // TODO accept alice@red.ilpdemo.org form
    message: 'ILP account address to receive payments (e.g. https://red.ilpdemo.org/ledger/accounts/alice):',
    // TODO get rid of defaults
    default: 'https://red.ilpdemo.org/ledger/accounts/alice'
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

  inquirer.prompt(prompts, function (params) {
    // TODO use the async versions of fs functions
    if (file) {
      paymentLicense.addLicenseToFile(file, {
        creator_account: params.creator_account,
        creator_public_key: params.creator_public_key,
        price_per_minute: params.price_per_minute
      }, allowOverwrite)
      .then(function (fileWithLicense) {
        fs.writeFileSync(filePath, fileWithLicense)

        // TODO do we want to return the object or string form?
        return paymentLicense.parseLicenseFromFile(fileWithLicense)
          .then(function (license) {
            console.log('Added license:', license)
          })
      })
      .catch(function (err) {
        console.error('Error: ' + err.message)
      })
    } else {
      console.log(paymentLicense.createLicense(params))
    }
  })
}
