import { Node } from '.'
import { Transform } from 'stream'

export const filter = (callback: (node: Node) => boolean) => {
  return new Transform({
    objectMode: true,
    autoDestroy: false,
    transform(chunk: Node, _encoding, next) {
      if (callback(chunk)) {
        this.push(chunk)
      }
      next()
    }
  })
}
