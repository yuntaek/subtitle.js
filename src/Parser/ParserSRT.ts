import { RE_TIMESTAMP, parseTimestamps, Node } from '..'
import { Parser } from './Parser'

export type Expectation = 'header' | 'id' | 'timestamp' | 'text'

export class ParserSRT extends Parser {
  private isWebVTT: boolean = false
  private expect: Expectation = 'header'

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

  private parseTimestamp(line: string) {
    if (!this.isTimestamp(line)) {
      throw this.getError('timestamp', this.row, line)
    }

    this.node = {
      type: 'cue',
      data: {
        ...parseTimestamps(line),
        text: ''
      }
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
    return RE_TIMESTAMP.test(line)
  }
}
