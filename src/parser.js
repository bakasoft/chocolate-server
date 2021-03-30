import * as rs from './resolvers.js'
import { q } from './utils.js'

const ESCAPABLE = ['\\', '\'', '{']
const FIRST_SYMBOL_REGEX = /[a-zA-Z$_-]/
const OTHER_SYMBOL_REGEX = /[0-9a-zA-Z$_-]/
const DIGITS = /[0-9]/

export function parseExpression(text) {
  return new Parser(text).readContent()
}

export function parseInstruction(text) {
  return new Parser(text).tryReadValue()
}

class Parser {
  constructor(content) {
    this.content = content
    this.position = 0
  }

  readContent(stopAtQuote) {
    const exprItems = []
    const buffer = []
    const flushBuffer = () => {
      if (buffer.length > 0) {
        exprItems.push(new rs.Literal(buffer.join('')))
  
        buffer.length = 0
      }
    }
  
    while (this.alive()) {
      if (this.tryPull('\\')) {
        if (!this.alive()) {
          throw this.error('Expected a valid escape sequence.')
        }
  
        const escaped = this.pull()
  
        if (ESCAPABLE.indexOf(escaped) === -1) {
          throw this.error(`Invalid escape sequence: ${q(`\\${escaped}`)}`)
        }
  
        buffer.append(escaped)
      } 
      else if (stopAtQuote === true && this.peek() === '\'') {
        break
      } 
      else if (this.tryPull('{')) {
        flushBuffer()

        this.skipBlanks()

        const exprItem = this.tryReadValue()

        if (exprItem === null) {
          throw this.error('Expected value')
        }
        
        this.skipBlanks()
        this.expect('}')
  
        exprItems.push(exprItem)
      } 
      else {
        buffer.push(this.pull())
      }
    }
  
    flushBuffer()
  
    if (exprItems.length === 1) {
      return exprItems[0]
    }
  
    return new rs.Concatenation(exprItems)
  }

  readArrayItems() {
    let item = this.tryReadValue()

    if (item === null) {
      return []
    }

    const items = [item]
    this.skipBlanks()

    while (this.tryPull(',')) {
      this.skipBlanks()

      item = this.tryReadValue()
      
      if (item === null) {
        throw rs.error('Expected item')
      }

      items.push(item)

      this.skipBlanks()
    } 
  

    return items
  }

  tryReadValue() {
    let value = this.tryReadNumber()
    if (value !== null) {
      return value
    }

    value = this.tryReadString()
    if (value !== null) {
      return value
    }

    value = this.tryReadVariable()
    if (value !== null) {
      return value;
    }

    return null
  }

  tryReadString() {
    if (!this.tryPull('\'')) {
      return null
    }

    const content = this.readContent(true)

    this.expect('\'')

    return content
  }

  tryReadNumber() {
    if (!DIGITS.test(this.peek())) {
      return null
    }

    const n = []

    do {
      n.push(this.pull())
    } while (DIGITS.test(this.peek()))

    return new rs.Literal(Number(n.join('')))
  }

  tryReadVariable() {
    let variable = this.tryReadField()

    if (variable === null) {
      return null
    }

    this.skipBlanks()

    if (this.tryPull('(')) {
      this.skipBlanks()

      const params = this.readArrayItems()

      this.skipBlanks()
      this.expect(')')

      variable = new rs.Invocation(variable, params)
    }

    return variable
  }

  tryReadField() {
    if (this.tryPull('.')) {
      return rs.SCOPE_GETTER
    }

    let id = this.tryReadIdentifier()
    if (id === null) {
      return null
    }

    // TODO add check for null and undefined

    let current = new rs.GetterStatic(id)

    while (true) {
      this.skipBlanks()

      if (this.tryPull('.')) {
        this.skipBlanks()

        id = this.tryReadIdentifier()
        if (id === null) {
          throw this.error('Expected identifier')
        }

        current = new rs.GetterNestedStatic(current, id)
      }
      else if (this.tryPull('[')) {
        this.skipBlanks()

        const index = this.tryReadValue()
        if (index === null) {
          throw this.error('Expected index')
        }

        this.skipBlanks()
        this.expect(']')

        current = new rs.GetterNestedDynamic(current, index)
      }
      else {
        break
      }
    }
    
    return current
  }

  tryReadIdentifier() {
    if (!FIRST_SYMBOL_REGEX.test(this.peek())) {
      return null
    }

    const id = []

    do {
      id.push(this.pull())
    } while (OTHER_SYMBOL_REGEX.test(this.peek()))

    return id.join('')
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
