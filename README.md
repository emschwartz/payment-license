# `payment-license` creator tool

> A library and command line tool for creating and parsing [Interledger Protocol (ILP)](https://interledger.org) payment-enabled licenses.

## Installation

Requires [Node.js](https://nodejs.org).

For writing tags to files, [mutagen](https://mutagen.readthedocs.org) is also required (see below for embedding options).

```sh
git clone https://github.com/emschwartz/payment-license
cd payment-license
npm install
```

## Usage

The `payment-license` tool will create and embed or read license details from media files. For each type of file there are a number of different tags that it will attempt to write to or read from, for example `comment` or `copyright` fields.

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

### Embedding using the CLI

The CLI can be used to embed the license in the tags of a media file directly.

It relies on [mutagen](https://mutagen.readthedocs.org) for writing ID3 tags.

### Embedding using other media tagger

First, create the license using the `payment-license` command with no file specified. This will print the license as a string that can be manually added to media files.

License information can be embedded in files using any program capable of editing ID3 tags, such as the tools listed on the [id3.org](http://id3.org/Implementations) site or some media players like VLC or iTunes. In VLC, the license would be embedded in either the `copyright` or `description` field (found under `Window > Media Information`). In iTunes, the license would be embedded in the `comments` field (found under `File > Get Info`).

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
