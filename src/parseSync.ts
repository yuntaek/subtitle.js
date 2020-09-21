import { createParser } from './Parser'
import { NodeList, FormatOptions } from '.'

export const parseSync = (
  input: string,
  { format }: FormatOptions
): NodeList => {
  const buffer: NodeList = []

  const parser = createParser({
    format,
    push: node => buffer.push(node)
  })

  input
    .replace(/\r\n/g, '\n')
    .split('\n')
    .forEach(line => parser.parseLine(line))

  parser.flush()

  return buffer
}
