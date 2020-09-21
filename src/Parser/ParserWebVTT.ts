import { ParserSRT } from './ParserSRT'

export class ParserWebVTT extends ParserSRT {
  protected reTimestamp = /^(?:(\d{1,}):)?(\d{2}):(\d{2})\.(\d{3})$/
  protected reTimestampGroup = /^((?:\d{1,}:)?\d{2}:\d{2}[,.]\d{3}) --> ((?:\d{1,}:)?\d{2}:\d{2}[,.]\d{3})(?: (.*))?$/

  protected parseSettings() {
    const match = this.reTimestampGroup.exec(this.line)

    if (match && match[3] && this.node.type === 'cue' && this.node.data) {
      this.node.data.settings = match[3]
    }
  }

  protected parseTimestamp() {
    super.parseTimestamp()
    this.parseSettings()
  }
}
