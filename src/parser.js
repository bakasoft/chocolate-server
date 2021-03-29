import lodash from 'lodash'
import {
  Literal, Getter, Concatenation, Mapper, Invocation, Actions,
} from './resolvers.js'
import { q } from './utils.js'

const ESCAPABLE = ['\\', '{', '(', '[', '.', ',', ']', ')', '}']

class Parser {
  constructor(content) {
    this.content = content
    this.position = 0
  }

  //

  readKey() {
    this.skipBlanks()
  }

  skipBlanks() {
    while (this.tryPull(' '));
  }

  //

  alive() {
    return this.position < this.content.length
  }

  peek() {
    if (this.position >= this.content.length) {
      throw this.error('Unexpected end.')
    }
    return this.content[this.position]
  }

  pull() {
    if (this.position >= this.content.length) {
      throw this.error('Unexpected end.')
    }
    const symbol = this.content[this.position]
    this.position++
    return symbol
  }

  tryPull(expected) {
    const symbol = this.content[this.position]

    if (symbol === expected) {
      this.position++
      return true
    }

    return false
  }

  expect(symbol) {
    if (this.pull() !== symbol) {
      throw this.error(`Expected symbol: ${q(symbol)}`)
    }
  }

  error(message) {
    const details = []

    details.push(message)

    details.push(this.content)
    details.push(`${' '.repeat(this.position)}^`)

    return new Error(details.join('\n'))
  }
}
