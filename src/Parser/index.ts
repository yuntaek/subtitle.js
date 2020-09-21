import { Parser, Pusher } from './Parser'
import { ParserSRT } from './ParserSRT'
import { ParserWebVTT } from './ParserWebVTT'
import { FormatOptions } from '..'

export interface ParserOptions extends FormatOptions {
  push: Pusher
}

export const createParser = ({ format, push }: ParserOptions): Parser => {
  return new {
    SRT: ParserSRT,
    WebVTT: ParserWebVTT
  }[format]({ push })
}
