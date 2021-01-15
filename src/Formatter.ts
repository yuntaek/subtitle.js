import { FormatOptions, Node, Cue, formatTimestamp } from '.'

export class Formatter {
  private options: FormatOptions
  private isVTT: boolean
  private hasReceivedHeader: boolean
  private index: number

  constructor(options: FormatOptions) {
    this.options = options
    this.hasReceivedHeader = false
    this.isVTT = options.format === 'WebVTT'
    this.index = 1
  }

  public format(node: Node): string {
    let buffer = ''

    if (node.type === 'header' && this.isVTT) {
      this.hasReceivedHeader = true
      buffer += `${node.data}\n\n`
    }

    if (node.type === 'cue') {
      if (!this.hasReceivedHeader && this.isVTT) {
        this.hasReceivedHeader = true
        buffer += 'WEBVTT\n\n'
      }

      buffer += this.formatCue(node.data, this.index++, this.options)
    }

    return buffer
  }

  private formatCueForSrtWithassTag(cue: Cue): Cue {
    let assTag: string = ''
    if (cue.settings) {
      const rawPosition = cue.settings.match(/position\s?=\s?([0-9]+)%/)
      const align = cue.settings.match(/align\s?=\s?([a-z]+)/)
      if (rawPosition && align) {
        const position = parseInt(rawPosition[1])
        if (position >= 90) {
          switch (align[1]) {
            case 'start ':
              assTag = 'an7'
              break
            case 'center':
              assTag = 'an8'
              break
            case 'end':
              assTag = 'an9'
              break
          }
        } else if (position <= 10) {
          switch (align[0]) {
            case 'start ':
              assTag = 'an1'
              break
            case 'center':
              assTag = 'an2'
              break
            case 'end':
              assTag = 'an3'
              break
          }
        } else {
          switch (align[0]) {
            case 'start ':
              assTag = 'an4'
              break
            case 'center':
              assTag = 'an5'
              break
            case 'end':
              assTag = 'an6'
              break
          }
        }
        cue.text = assTag !== '' ? `{\\${assTag}}${cue.text}` : cue.text
      }
    }
    return cue
  }
  private formatCue(cue: Cue, index: number, options: FormatOptions) {
    if (options.format === 'SRT') {
      cue = this.formatCueForSrtWithassTag(cue)
    }
    return [
      `${index > 1 ? '\n' : ''}${index}`,
      `${formatTimestamp(cue.start, options)} --> ${formatTimestamp(
        cue.end,
        options
      )}${options.format ===
        ('WebVTT' && cue.settings ? ' ' + cue.settings : '')}`,
      cue.text,
      ''
    ].join('\n')
  }
}
