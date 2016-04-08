# `payment-license` creator tool

> A library and command line tool for creating and parsing [Interledger Protocol (ILP)](https://interledger.org) payment-enabled licenses.

## Installation

Requires [Node.js](https://nodejs.org)

```sh
git clone https://github.com/emschwartz/payment-license
cd payment-license
npm install
```

## Usage

When the tool is used on a file it will embed the license in the file's metadata tags.

```sh
  Usage: payment-license [options] [file]

  Command line tool for generating and parsing payment licenses

  Options:

    -h, --help  output usage information
    --read  parse license from file

  Examples:

    $ payment-license                            Runs the license creator tool and prints the output
    $ payment-license ./path/to/song.mp3         Runs the license creator and attaches license to file
    $ payment-license --read ./path/to/song.mp3  Parse the license from the file

```

## Supported filetypes

- [x] mp3
- [ ] mp4
- [ ] jpg
- [ ] pdf

## License format

### Fields

#### Supplied by creator

* `license_type` - `"https://interledger.org/licenses/1.0/mpay"` (more will be supported in the future)
* `creator_account` - ILP enabled account that licensees should pay
* `creator_public_key` - 32-byte [ed25519](https://ed25519.cr.yp.to) public key that the licensor will use to sign licenses
* `price_per_minute` - Price, denominated in asset of the `creator_account`'s ledger, per minute the license is to be valid

#### Supplied by the licensee

* `licensee_public_key` - 32-byte [ed25519](https://ed25519.cr.yp.to) public key of the licensee
* `expires_at` - [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) Date when the license expires

### Stringified version

`https://interledger.org/licenses/1.0/mpay?creator_account={...}&creator_public_key={...}&price_per_minute={...}`