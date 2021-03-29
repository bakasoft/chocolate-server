import lodash from 'lodash'
import { Literal, Getter, Concatenation, Mapper, Invocation, Actions } from './resolvers.js'
import { q } from './utils.js'

export function parseValue(value) {
    const type = typeof value

    if (type === 'object' && value !== null && value !== undefined) {
        return parseObjectOrArray(value)
    }
    else if (type === 'string') {
        return rawParseString(new Tape(value), [])
    }

    // Boolean, Number, null, undefined, etc... goes here
    return new Literal(value)
}

export function parseActions(value) {
    if (value && value.length > 0) {
        const items = []

        for (const item of value) {
            items.push(rawParseInstruction(new Tape(item), []))
        }
    
        return new Actions(items)
    }

    return new Literal(undefined)
}

function parseObjectOrArray(template) {
    const exprMap = {}

    for (const key of Object.keys(template)) {
        exprMap[key] = parseValue(template[key])
    }

    return new Mapper(exprMap)
}

const BLANKS = [' ']
const ESCAPABLE = ['\\', '{', '(', '[', '.', ',', ']', ')', '}']

class Tape {
    
    constructor(content) {
        this.content = content
        this.position = 0
    }

    alive() {
        return this.position < this.content.length
    }

    peek() {
        if (this.position >= this.content.length) {
            throw this.error(`Unexpected end.`)
        }
        return this.content[this.position]
    }

    pull() {
        if (this.position >= this.content.length) {
            throw this.error(`Unexpected end.`)
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
        else {
            return false
        }
    }

    skipBlanks() {
        while (BLANKS.indexOf(this.content[this.position]) !== -1) {
            this.position++
        }
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
        details.push(' '.repeat(this.position) + '^')
        
        return new Error(details.join('\n'))
    }
}

function rawParseString(tape, stopAt) {
    const exprItems = []
    const buffer = []
    const flushBuffer = () => {
        if (buffer.length > 0) {
            exprItems.push(new Literal(buffer.join('')))

            buffer.length = 0
        }
    }

    while (tape.alive()) {
        if (tape.tryPull('\\')) {
            if (!tape.alive()) {
                throw tape.error(`Expected a valid escape sequence.`)
            }

            const escaped = tape.pull()

            if (ESCAPABLE.indexOf(escaped) === -1) {
                throw tape.error(`Invalid escape sequence: ${q('\\' + escaped)}`)
            }

            buffer.append(escaped)
        }
        else if (stopAt.indexOf(tape.peek()) !== -1) {
            break
        }
        else if (tape.peek() === '{') {
            flushBuffer()

            tape.expect('{')
    
            stopAt.push('}')
            const exprItem = rawParseInstruction(tape, stopAt)
            stopAt.pop()

            tape.expect('}')

            exprItems.push(exprItem)
        }
        else {
            buffer.push(tape.pull())
        }
    }

    flushBuffer()

    if (exprItems.length === 1) {
        return exprItems[0]
    }

    return new Concatenation(exprItems)
}

function rawParseInstruction(tape, stopAt) {
    tape.skipBlanks()

    stopAt.push(' ')
    stopAt.push('(')
    const base = rawParseString(tape, stopAt)
    stopAt.pop()
    stopAt.pop()

    tape.skipBlanks()

    if (tape.tryPull('(')) {
        tape.skipBlanks()

        const params = []

        while (tape.peek() !== ')') {
            stopAt.push(' ')
            stopAt.push(')')
            stopAt.push(',')
            const param = rawParseString(tape, stopAt)
            stopAt.pop()
            stopAt.pop()
            stopAt.pop()

            params.push(param)

            tape.skipBlanks()
            
            if (tape.tryPull(',')) {
                tape.skipBlanks()
            }
            else {
                break
            }
        }

        tape.expect(')')
        tape.skipBlanks()

        return new Invocation(base, params)
    }
    else {
        return new Getter(base)
    }
    
}
