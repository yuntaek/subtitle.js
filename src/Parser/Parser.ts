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
  protected expect: string = ''

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

  protected getParsers() {
    return {}
  }

  protected processLine() {
    ;(this.getParsers() as any)[this.expect]()
  }

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
    ;['first', 'last'].forEach(method => {
      while (true) {
        const item = this.buffer[
          method === 'first' ? 0 : this.buffer.length - 1
        ]
        if (['', '\n'].includes(item)) {
          this.buffer[method === 'first' ? 'shift' : 'pop']()
        } else {
          break
        }
      }
    })
  }
}
