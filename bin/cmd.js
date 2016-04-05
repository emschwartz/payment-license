#!/usr/bin/env node

var paymentLicense = require('../')
var fs = require('fs')
var path = require('path')
var inquirer = require('inquirer')

// TODO use a real options parser library
if (process.argv[2] === '--read') {
  var filePath = path.resolve(process.cwd(), process.argv[3])
  var file = fs.readFileSync(filePath)
  paymentLicense.parseLicenseFromFile(file)
    .then(function (license) {
      console.log(license)
    })
  return
}

var partialFilePath = process.argv[2]

// TODO validate input
console.log('Welcome to the payment-license creator tool')
var prompts = [{
  type: 'input',
  name: 'fileName',
  message: 'File(s) to add license to:',
  default: partialFilePath
}, {
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
  // TODO handle directories
  // TODO if the fileName is null just print the license details
  var filePath = path.resolve(process.cwd(), params.fileName)
  var file = fs.readFileSync(filePath)
  paymentLicense.addLicenseToFile(file, {
    creator_account: params.creator_account,
    creator_public_key: params.creator_public_key,
    price_per_minute: params.price_per_minute
  })
  .then(function (fileWithLicense) {
    fs.writeFileSync(filePath, fileWithLicense)

    return paymentLicense.parseLicenseFromFile(fileWithLicense)
      .then(function (license) {
        console.log('Added license:', license)
      })
  })
  .catch(function (err) {
    console.error('Error: ' + err.message)
  })
})
