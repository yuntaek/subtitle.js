export interface Timestamp {
  start: number
  end: number
}

export interface Cue extends Timestamp {
  text: string
  settings?: string
}

export type Format = 'SRT' | 'WebVTT'

export interface FormatOptions {
  format: Format
}

export interface NodeHeader {
  type: 'header'
  data: string
}

export interface NodeCue {
  type: 'cue'
  data: Cue
}

export type Node = NodeHeader | NodeCue

export type NodeList = Node[]
