import * as utils from '../test-utils'
import { parse } from '../src'

test.each(utils.fixtures)('parse SRT fixture: %s', async fixture => {
  const buffer = await utils.pipeline(
    utils.getFixtureStream(fixture, 'srt').pipe(parse({ format: 'SRT' }))
  )
  const expected = JSON.parse(await utils.getFixture(fixture, 'srt.json'))

  expect(buffer).toEqual(expected)
})

test.each(utils.fixtures)('parse VTT fixture: %s', async fixture => {
  const buffer = await utils.pipeline(
    utils.getFixtureStream(fixture, 'vtt').pipe(parse({ format: 'WebVTT' }))
  )
  const expected = JSON.parse(await utils.getFixture(fixture, 'vtt.json'))

  expect(buffer).toEqual(expected)
})

test('error handling for invalid timestamp', done => {
  const stream = utils.createStreamFromString(`
1
Foo Bar
{{ THIS IS A INVALID TIMESTAMP }}
`)

  stream.pipe(parse({ format: 'SRT' })).on('error', err => {
    expect(err).toEqual(
      new Error(`expected timestamp at row 2, but received: "Foo Bar"`)
    )
    done()
  })
})

test('error handling for invalid WEBVTT header', done => {
  const stream = utils.createStreamFromString(`
INVALID WEBVTT HEADER

1
12:34.647 --> 12:35.489
Some text here
`)

  stream.pipe(parse({ format: 'WebVTT' })).on('error', err => {
    expect(err).toEqual(
      new Error(
        `expected WEBVTT header at row 1, but received: "INVALID WEBVTT HEADER"`
      )
    )
    done()
  })
})

test('error handling for missing WEBVTT header', done => {
  const stream = utils.createStreamFromString(`
1
4:28.123 --> 4:29.899
Hello, World!
`)

  stream.pipe(parse({ format: 'WebVTT' })).on('error', err => {
    expect(err).toEqual(
      new Error(`expected WEBVTT header at row 1, but received: "1"`)
    )
    done()
  })
})

test('error handling for invalid identifiers', done => {
  const stream = utils.createStreamFromString(`
INVALID_ID
00:02:15,202 --> 00:02:18,547
Hello, World!
`)

  stream.pipe(parse({ format: 'SRT' })).on('error', err => {
    expect(err).toEqual(
      new Error(
        `expected number identifier at row 1, but received: "INVALID_ID"`
      )
    )
    done()
  })
})
