#!/usr/bin/env node

var paymentLicense = require('../')
var fs = require('fs')
var path = require('path')

var fileName = process.argv[2]
if (!fileName) {
  throw new Error('payment-license <path_to_file>')
}
// TODO use https://github.com/SBoudrias/Inquirer.js/
// TODO use the async versions of fs functions
var filePath = path.resolve(process.cwd(), fileName)
var file = fs.readFileSync(filePath)
paymentLicense.addToFile(file, {
  creator_account: 'https://red.ilpdemo.org/ledger/accounts/alice',
  creator_public_key: 'r/MV0THsvdcUAw7Y8x8ca2/dEc8gXRQNDapQ6xFUG3E=', // secret: 9u9KxA3aAQ+9rMZTuXtJjZMOImQwzhHWVGea9oPyqj2v8xXRMey91xQDDtjzHxxrb90RzyBdFA0NqlDrEVQbcQ==
  price_per_minute: '0.0001'
})
.then(function (fileWithLicense) {
  fs.writeFileSync(filePath, fileWithLicense)

  return paymentLicense.parseLicense(fileWithLicense)
    .then(function (license) {
      console.log('Added license: ' + license)
    })
})
.catch(function (err) {
  console.error('Error: ' + err.message)
})
