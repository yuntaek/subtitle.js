import { Node, Timestamp } from '..'
import { Parser } from './Parser'

export type Expectation = 'header' | 'id' | 'timestamp' | 'text'

export class ParserSRT extends Parser {
  private isWebVTT: boolean = false
  private expect: Expectation = 'header'

  protected reTimestamp = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/
  protected reTimestampGroup = /^(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})$/

  protected processLine() {
    const parse = {
      header: this.parseHeader,
      id: this.parseId,
      timestamp: this.parseTimestamp,
      text: this.parseText
    }[this.expect]

    parse.call(this, this.line)
  }

  public flush() {
    if (this.buffer.length > 0) {
      this.pushNode()
    }
  }

  private parseHeader(line: string) {
    if (!this.isWebVTT) {
      this.isWebVTT = /^WEBVTT/.test(line)

      if (this.isWebVTT) {
        this.node.type = 'header'
      } else {
        this.parseId(line)
        return
      }
    }

    this.buffer.push(line)

    if (!line) {
      this.expect = 'id'
      return
    }
  }

  private parseId(line: string) {
    this.expect = 'timestamp'

    if (this.node.type === 'header') {
      this.pushNode()
    }

    if (!this.isIndex(line)) {
      this.parseTimestamp(line)
    }
  }

  protected getTimestamps(line: string): Timestamp {
    const match = this.reTimestampGroup.exec(line)

    if (!match) {
      throw new Error('Invalid timestamp format')
    }

    const timestamp: Timestamp = {
      start: this.timestampToMilliseconds(match[1]),
      end: this.timestampToMilliseconds(match[2])
    }

    if (match[3]) {
      timestamp.settings = match[3]
    }

    return timestamp
  }

  protected timestampToMilliseconds(timestamp: string): number {
    const match = timestamp.match(this.reTimestamp)

    if (!match) {
      throw new Error('Invalid timestamp')
    }

    const hours = match[1] ? parseInt(match[1], 10) * 3600000 : 0
    const minutes = parseInt(match[2], 10) * 60000
    const seconds = parseInt(match[3], 10) * 1000
    const milliseconds = parseInt(match[4], 10)

    return hours + minutes + seconds + milliseconds
  }

  private parseTimestamp(line: string) {
    try {
      this.node = {
        type: 'cue',
        data: {
          ...this.getTimestamps(line),
          text: ''
        }
      }
    } catch (err) {
      throw this.getError('timestamp', this.row, line)
    }

    this.expect = 'text'
  }

  private parseText(line: string) {
    if (this.buffer.length > 0 && this.isTimestamp(line)) {
      const lastIndex = this.buffer.length - 1

      if (this.isIndex(this.buffer[lastIndex])) {
        this.buffer.pop()
      }

      this.pushNode()
      this.parseTimestamp(line)
    } else {
      this.buffer.push(line)
    }
  }

  private pushNode(): void {
    if (this.node.type === 'cue') {
      this.trimBuffer()
      this.node.data!.text = this.buffer.join('\n')
    }

    if (this.node.type === 'header') {
      this.node.data = this.buffer.join('\n').trim()
    }

    this.push(this.node as Node)

    this.reset()
  }

  private isIndex(line: string): boolean {
    return /^\d+$/.test(line.trim())
  }

  private isTimestamp(line: string): boolean {
    return this.reTimestampGroup.test(line)
  }
}
