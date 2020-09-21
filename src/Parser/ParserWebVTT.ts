import { ParserSRT } from './ParserSRT'

export class ParserWebVTT extends ParserSRT {
  protected reTimestamp = /^(?:(\d{1,}):)?(\d{2}):(\d{2})\.(\d{3})$/
  protected reTimestampGroup = /^((?:\d{1,}:)?\d{2}:\d{2}[,.]\d{3}) --> ((?:\d{1,}:)?\d{2}:\d{2}[,.]\d{3})(?: (.*))?$/
}
