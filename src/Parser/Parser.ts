import stripBom from 'strip-bom'
import { Node } from '..'

export type Pusher = (node: Node) => void

export class Parser {
  protected push: Pusher

  protected row: number = 0
  protected node: Partial<Node> = {}
  protected buffer: string[] = []
  protected line: string = ''
  protected hasContentStarted: boolean = false

  public constructor({ push }: { push: Pusher }) {
    this.push = push
  }

  public parseLine(line: string) {
    this.line = this.row === 0 ? stripBom(line) : line

    if (!this.hasContentStarted) {
      if (line.trim()) {
        this.hasContentStarted = true
      } else {
        return
      }
    }

    this.processLine()
    this.row++
  }

  protected processLine() {}

  public flush() {}

  protected reset() {
    this.node = {}
    this.buffer = []
  }

  protected getError(expected: string, index: number, row: string): Error {
    return new Error(
      `expected ${expected} at row ${index + 1}, but received: "${row}"`
    )
  }

  protected trimBuffer() {
    while (true) {
      const lastItem = this.buffer[this.buffer.length - 1]
      if (['', '\n'].includes(lastItem)) {
        this.buffer.pop()
      } else {
        break
      }
    }

    while (true) {
      const firstItem = this.buffer[0]
      if (['', '\n'].includes(firstItem)) {
        this.buffer.shift()
      } else {
        break
      }
    }
  }
}
