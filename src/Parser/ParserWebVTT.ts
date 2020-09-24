import { ParserSRT } from './ParserSRT'

export class ParserWebVTT extends ParserSRT {
  protected reTimestamp = /^(?:(\d{1,}):)?(\d{2}):(\d{2})\.(\d{3})$/
  protected reTimestampGroup = /^((?:\d{1,}:)?\d{2}:\d{2}[,.]\d{3}) --> ((?:\d{1,}:)?\d{2}:\d{2}[,.]\d{3})(?: (.*))?$/

  protected expect = 'header'

  protected getParsers() {
    return {
      ...super.getParsers(),
      header: this.parseHeader.bind(this)
    }
  }

  protected parseHeader() {
    if (this.row === 0) {
      if (/^WEBVTT/.test(this.line)) {
        this.node.type = 'header'
      } else {
        throw this.getError('WEBVTT header')
      }
    }

    if (this.line) {
      this.buffer.push(this.line)
      return
    }

    this.pushNode()

    this.expect = 'id'
  }

  protected parseSettings() {
    const match = this.reTimestampGroup.exec(this.line)

    if (match && match[3] && this.node.type === 'cue' && this.node.data) {
      this.node.data.settings = match[3]
    }
  }

  protected parseId() {
    this.expect = 'timestamp'

    if (!this.isIndex(this.line)) {
      this.parseTimestamp()
    }
  }

  protected parseTimestamp() {
    super.parseTimestamp()
    this.parseSettings()
  }

  protected pushNode() {
    if (this.node.type === 'header') {
      this.node.data = this.buffer.join('\n').trim()
    }

    super.pushNode()
  }
}
