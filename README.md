# subtitle

[![Build Status](https://img.shields.io/travis/gsantiago/subtitle.js/master?style=flat-square)](https://travis-ci.org/gsantiago/subtitle.js)
[![Code Climate](https://img.shields.io/codeclimate/maintainability/gsantiago/subtitle.js?style=flat-square)](https://codeclimate.com/github/gsantiago/subtitle.js)
[![Coverage Status](https://img.shields.io/coveralls/github/gsantiago/subtitle.js?style=flat-square)](https://coveralls.io/github/gsantiago/subtitle.js?branch=master)
[![downloads](https://img.shields.io/npm/dm/subtitle?style=flat-square)](https://www.npmjs.com/package/subtitle)
[![npm](https://img.shields.io/npm/v/subtitle?style=flat-square)](https://www.npmjs.com/package/subtitle)

Stream-based library for parsing and manipulating subtitle files.

>["Thanks for this rad package!"](https://github.com/gsantiago/subtitle.js/pull/15#issuecomment-282879854)
>John-David Dalton, creator of Lodash

:white_check_mark: Stream API<br>
:white_check_mark: Written in TypeScript<br>
:white_check_mark: SRT support<br>
:white_check_mark: Partial support for WebVTT (full support comming soon)<br>
:white_check_mark: 100% code coverage<br>
:white_check_mark: Actively maintained since 2015

## Installation

### npm

`npm install subtitle`

### yarn

`yarn add subtitle`

## Usage

This library provides some stream-based functions to work with subtitles. The following example parses a SRT file, resyncs it and outputs a VTT file:

```ts
import fs from 'fs'
import { parse, resync, stringify } from 'subtitle'

fs.createReadStream('./my-subtitles.srt')
  .pipe(parse({ format: 'SRT' }))
  .pipe(resync(-100))
  .pipe(stringify({ format: 'WebVTT' }))
  .pipe(fs.createWriteStream('./my-subtitles.vtt'))
```

It also provides functions like `map` and `filter`:

```ts
import { parse, map, filter, stringify } from 'subtitle'

inputStream
  .pipe(parse({ format: 'SRT' }))
  .pipe(
    filter(
      // strips all cues that contains "𝅘𝅥𝅮"
      node => !(node.type === 'cue' && node.data.text.includes('𝅘𝅥𝅮'))
    )
  )
  .pipe(
    map(node => {
      if (node.type === 'cue') {
        // convert all cues to uppercase
        node.data.text = node.data.text.toUpperCase()
      }

      return node
    })
  )
  .pipe(stringify({ format: 'WebVTT' }))
  .pipe(outputStream)
```

Besides the stream functions, this module also provides synchronous functions like `parseSync` and `stringifySync`. However, you should avoid them and use the stream-based functions for better performance:

```ts
import { parseSync, stringifySync } from 'subtitle'

const nodes = parseSync(srtContent, { format: 'SRT' })

// do something with your subtitles
// ...

const output = stringify(nodes, { format: 'WebVTT' })
```

## API

The module exports the following functions:

* [`parse`](#parse)
* [`parseSync`](#parseSync)
* [`stringify`](#stringify)
* [`stringifySync`](#stringifySync)
* [`map`](#map)
* [`filter`](#filter)
* [`resync`](#resync)

### parse

- `parse({ format: 'SRT' | 'WebVTT' }): DuplexStream`

It returns a Duplex stream for parsing subtitle contents (SRT or WebVTT).

```ts
import { parse } from 'subtitle'

inputStream
  .pipe(parse({ format: 'SRT' }))
  .on('data', node => {
    console.log('parsed node:', node)
  })
  .on('error', console.error)
  .on('finish', () => console.log('parser has finished'))
```

Check out the [Examples](#examples) section for more use cases.

### parseSync

- `parseSync(input: string, { format: 'SRT' | 'WebVTT' }): Node[]`

> **NOTE**: For better perfomance, consider using the stream-based `parse` function

It receives a string containing a SRT or VTT content and returns
an array of nodes:

```ts
import { parseSync } from 'subtitle'
import fs from 'fs'

const input = fs.readFileSync('awesome-movie.srt', 'utf8')

parseSync(input, { format: 'SRT' })

// returns an array like this:
[
  {
    type: 'cue',
    data: {
      start: 20000, // milliseconds
      end: 24400,
      text: 'Bla Bla Bla Bla'
    }
  },
  {
    type: 'cue',
    data: {
      start: 24600,
      end: 27800,
      text: 'Bla Bla Bla Bla',
      settings: 'align:middle line:90%'
    }
  },
  // ...
]
```

### stringify

- `stringify({ format: 'SRT' | 'WebVTT' }): DuplexStream`

It returns a Duplex that receives parsed nodes and transmits the node formatted in SRT or WebVTT:

```ts
import { parse, stringify } from 'subtitle'

inputStream
  .pipe(parse())
  .pipe(stringify({ format: 'WebVTT' }))
```

Check out the [Examples](#examples) section for more use cases.

### stringifySync

- `stringify(nodes: Node[], options: { format: 'SRT' | 'vtt }): string`

> **NOTE**: For better perfomance, consider using the stream-based `stringify` function

It receives an array of captions and returns a string in SRT (default), but it also supports VTT format through the options.

```ts
import { stringifySync } from 'subtitle'

stringifySync(nodes, { format: 'SRT' })
// returns a string in SRT format

stringifySync(nodes, { format: 'WebVTT' })
// returns a string in VTT format
```

### map

- `map(callback: function): DuplexStream`

A useful Duplex for manipulating parsed nodes. It works similar to the `Array.map` function, but for streams:

```ts
import { parse, map, stringify } from 'subtitle'

inputStream
  .pipe(parse({ format: 'WebVTT' }))
  .pipe(map((node, index) => {
    if (node.type === 'cue') {
      node.data.text = node.data.text.toUpperCase()
    }

    return node
  }))
  .pipe(stringify({ format: 'SRT' }))
  .pipe(outputStream)
```

### filter

- `filter(callback: function): DuplexStream`

A useful Duplex for filtering parsed nodes. It works similar to the `Array.filter` function, but for streams:

```ts
import { parse, filter, stringify } from 'subtitle'

inputStream
  .pipe(parse({ format: 'WebVTT' }))
  .pipe(filter((node, index) => {
    return !(node.type === 'cue' && node.data.text.includes('𝅘𝅥𝅮'))
  }))
  .pipe(stringify({ format: 'SRT' }))
  .pipe(outputStream)
```

### resync

- `resync(time: number): DuplexStream`

Resync all cues from the stream:

```ts
import { parse, resync, stringify } from 'subtitle'

// Advance subtitles by 1s
readableStream
  .pipe(parse({ format: 'SRT'  }))
  .pipe(resync(1000))
  .pipe(outputStream)

// Delay 250ms
stream.pipe(resync(captions, -250))
```

## Examples

### Nodes

This is what a list of nodes looks like:

```ts
[
  {
    type: 'header',
    data: 'WEBVTT - Header content'
  },
  {
    type: 'cue',
    data: {
      start: 150066, // timestamp in milliseconds,
      end: 158952,
      text: 'With great power comes great responsibility'
    }
  },
  ...
]
```

For now, it only supports two types of node: `header` and `cue`. Soon, it will support more types
like `comment`.

### Convert SRT file to WebVTT

```ts
import fs from 'fs'
import { parse, stringify } from 'subtitle'

fs.createReadStream('./source.srt')
  .pipe(parse({ format: 'SRT' }))
  .pipe(stringify({ format: 'WebVTT' }))
  .pipe(fs.createWriteStream('./dest.vtt'))
```

### Extract subtitles from a video

The following example uses the `rip-subtitles` for extracting subtitles from a mkv video and save it
as WebVTT.

```ts
import extract from 'rip-subtitles'
import { parse, stringify } from 'subtitle'

extract('video.mkv')
  .pipe(parse({ format: 'SRT' }))
  .pipe(stringify({ format: 'WebVTT' }))
  .pipe(fs.createWriteStream('./video.vtt'))
```

### Create subtitles

```ts
import { stringifySync } from 'subtitle'

const list = []

list.push({
  type: 'cue',
  data: {
    start: 1200,
    end: 1300,
    text: 'Something'
  }
})

stringifySync(list, { format: 'WebVTT' })
```

## License

MIT
