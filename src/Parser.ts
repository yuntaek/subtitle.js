import stripBom from 'strip-bom'
import { Node, RE_TIMESTAMP, parseTimestamps, Cue } from '.'

export type Pusher = (node: Node) => void

export interface ParseState {
  expect: 'header' | 'id' | 'timestamp' | 'text'
  row: number
  hasContentStarted: boolean
  isWebVTT: boolean
  node: Partial<Node>
  buffer: string[]
}

interface ParsedSetting {
  setting: string
  line: string
}

export class Parser {
  private push: Pusher
  private state: ParseState

  constructor({ push }: { push: Pusher }) {
    this.push = push
    this.state = {
      expect: 'header',
      row: 0,
      hasContentStarted: false,
      isWebVTT: false,
      node: {},
      buffer: []
    }
  }

  private isIndex(line: string): boolean {
    return /^\d+$/.test(line.trim())
  }

  private isTimestamp(line: string): boolean {
    return RE_TIMESTAMP.test(line)
  }

  private getError(expected: string, index: number, row: string): Error {
    return new Error(
      `expected ${expected} at row ${index + 1}, but received: "${row}"`
    )
  }

  public parseLine(line: string): void {
    const contents = this.state.row === 0 ? stripBom(line) : line

    if (!this.state.hasContentStarted) {
      if (contents.trim()) {
        this.state.hasContentStarted = true
      } else {
        return
      }
    }

    const parse = {
      header: this.parseHeader,
      id: this.parseId,
      timestamp: this.parseTimestamp,
      text: this.parseText
    }[this.state.expect]

    parse.call(this, contents)

    this.state.row++
  }

  public flush(): void {
    if (this.state.buffer.length > 0) {
      this.pushNode()
    }
  }

  private parseHeader(line: string) {
    if (!this.state.isWebVTT) {
      this.state.isWebVTT = /^WEBVTT/.test(line)

      if (this.state.isWebVTT) {
        this.state.node.type = 'header'
      } else {
        this.parseId(line)
        return
      }
    }

    this.state.buffer.push(line)

    if (!line) {
      this.state.expect = 'id'
      return
    }
  }

  private parseId(line: string) {
    this.state.expect = 'timestamp'

    if (this.state.node.type === 'header') {
      this.pushNode()
    }

    if (!this.isIndex(line)) {
      this.parseTimestamp(line)
    }
  }

  private parseTimestamp(line: string) {
    if (!this.isTimestamp(line)) {
      throw this.getError('timestamp', this.state.row, line)
    }

    this.state.node = {
      type: 'cue',
      data: {
        ...parseTimestamps(line),
        text: ''
      }
    }

    this.state.expect = 'text'
  }

  private parseText(line: string) {
    if (this.state.buffer.length > 0 && this.isTimestamp(line)) {
      const lastIndex = this.state.buffer.length - 1

      if (this.isIndex(this.state.buffer[lastIndex])) {
        this.state.buffer.pop()
      }

      this.pushNode()
      this.parseTimestamp(line)
    } else {
      if (!this.state.isWebVTT) {
        const result = this.parseSetting(line)
        if (result) {
          this.state.buffer.push(result.line)
          this.state.node.data = this.state.node.data as Cue
          this.state.node.data.settings = result.setting
          return
        }
      }
      this.state.buffer.push(line)
    }
  }

  private transitAssToLineStyle(ass: string): string {
    switch (ass) {
      case 'an1':
        return 'position=5% align=start'
      case 'an2':
        return 'position=5% align=center'
      case 'an3':
        return 'position=5% align=end'
      case 'an4':
        return 'position=50% align=start'
      case 'an5':
        return 'position=50% align=center'
      case 'an6':
        return 'position=50% align=end'
      case 'an7':
        return 'position=95% align=start'
      case 'an8':
        return 'position=95% align=center'
      case 'an9':
        return 'position=95% align=end'
      default:
        return ''
    }
  }
  private parseSetting(line: string): ParsedSetting | undefined {
    const parsedLine = line.match(/^\{\\(an[1-9])\}(.*)/)

    if (parsedLine && parsedLine.length === 3) {
      return {
        line: parsedLine[2],
        setting: this.transitAssToLineStyle(parsedLine[1])
      }
    }
    return
  }

  private pushNode(): void {
    if (this.state.node.type === 'cue') {
      while (true) {
        const lastItem = this.state.buffer[this.state.buffer.length - 1]
        if (['', '\n'].includes(lastItem)) {
          this.state.buffer.pop()
        } else {
          break
        }
      }

      while (true) {
        const firstItem = this.state.buffer[0]
        if (['', '\n'].includes(firstItem)) {
          this.state.buffer.shift()
        } else {
          break
        }
      }

      this.state.node.data!.text = this.state.buffer.join('\n')
    }

    if (this.state.node.type === 'header') {
      this.state.node.data = this.state.buffer.join('\n').trim()
    }

    this.push(this.state.node as Node)

    this.state.node = {}
    this.state.buffer = []
  }
}
