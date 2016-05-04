# `payment-license` creator tool

> A library and command line tool for creating and parsing [Interledger Protocol (ILP)](https://interledger.org) payment-enabled licenses.

## Installation

Requires [Node.js](https://nodejs.org).

Additional dependencies are needed to embed licenses in files. See [Supported File Types](#supported-file-types)

```sh
git clone https://github.com/emschwartz/payment-license
cd payment-license
npm install
```

## Usage

### CLI

```sh
  Usage: payment-license [options] [file]

  Command line tool for generating and parsing payment licenses

  Options:

    -h, --help   output usage information
    --read       parse license from file
    --overwrite  overwrite existing file license

  Examples:

    $ payment-license                            Runs the license creator tool and prints the output
    $ payment-license ./path/to/song.mp3         Runs the license creator and attaches license to file
    $ payment-license --read ./path/to/song.mp3  Parse the license from the file
```

### Node.js or Browser

```js
const paymentLicense = require('payment-license')

// Check if the file type is supported
console.log(paymentLicense.supportsFileType('path/to/mov.mp4'))
// true

// Parse a license from a file
// (you can pass either a path to the file in Node.js, a Buffer or a File object)
console.log(paymentLicense.parseLicenseFromFile('path/to/mov.mp4'))
// {
//   creator_account: 'https://red.ilpdemo.org/ledger/accounts/alice',
//   creator_public_key: 'r/MV0THsvdcUAw7Y8x8ca2/dEc8gXRQNDapQ6xFUG3E=',
//   price_per_minute: '0.0001',
//   license_type: 'https://interledger.org/licenses/1.0/mpay'
// }

// (Node.js only, see below) Attach a license to a file
paymentLicense.addLicenseToFile('path/to/mov.mp4', {
  creator_account: 'https://red.ilpdemo.org/ledger/accounts/alice',
  creator_public_key: 'r/MV0THsvdcUAw7Y8x8ca2/dEc8gXRQNDapQ6xFUG3E=',
  price_per_minute: '0.0001',
  license_type: 'https://interledger.org/licenses/1.0/mpay'
})
.then(function () {
  // Promise resolves once license has been written to file
})
```

## Supported File Types

| File type | Read tags | Write tags |
|   :---:   |   :---:   |   :---:    |
| `mp3` | :white_check_mark: | :white_check_mark: \(Node.js only, requires [mutagen](https://mutagen.readthedocs.org)) |
| `mp4` | :white_check_mark: | :white_check_mark: \(Node.js only, requires [ffmpeg](https://www.ffmpeg.org/)) |
| `torrent` | :white_medium_small_square: | :white_medium_small_square: |
| `jpg` | :white_medium_small_square: | :white_medium_small_square: |
| `pdf`| :white_medium_small_square: | :white_medium_small_square: |

## Embedding Licenses

Licenses can be embedded directly with the CLI or created with the CLI and embedded with another program.

### Embedding using the CLI

The CLI relies on external tools to write the license into file metadata. See the [Supported File Types](#supported-file-types) for the additional dependencies.

### Embedding using other media tagger

First, create the license using the `payment-license` command with no file specified. This will print the license as a string that can be manually added to media files.

License information can be embedded in files using any program capable of editing metadata tags.

For audio and video files, some media players like VLC or iTunes can edit the file metadata. In VLC, the license would be embedded in either the `copyright` or `description` field (found under `Window > Media Information`). In iTunes, the license would be embedded in the `comments` field (found under `File > Get Info`).

## License format

### Fields

#### Supplied by creator

* `license_type` - `"https://interledger.org/licenses/1.0/mpay"` (more will be supported in the future)
* `creator_account` - ILP enabled account that licensees should pay
* `creator_public_key` - 32-byte [ed25519](https://ed25519.cr.yp.to) public key that the licensor will use to sign licenses
* `price_per_minute` - Price, denominated in asset of the `creator_account`'s ledger, per minute the license is to be valid

#### Supplied by the licensee

These fields are added by the licensee when they are paying for a license. The creator signs the license including these fields.

* `licensee_public_key` - 32-byte [ed25519](https://ed25519.cr.yp.to) public key of the licensee
* `expires_at` - [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) Date when the license expires

### Stringified version

`https://interledger.org/licenses/1.0/mpay?creator_account={...}&creator_public_key={...}&price_per_minute={...}`
