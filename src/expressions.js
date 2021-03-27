import lodash from 'lodash'
import { Literal, Getter, Concatenation, Mapper, Invocation } from './resolvers.js'

export function parse(value) {
    const type = typeof value

    if (type === 'object' && value !== null && value !== undefined) {
        return parseMapper(value)
    }
    else if (type === 'string') {
        return parseText(new Tape(value))
    }

    return new Literal(value)
}

function parseMapper(template) {
    const exprMap = {}
    for (const key of Object.keys(template)) {
        exprMap[key] = parse(template[key])
    }

    return new Mapper(exprMap)
}

class Tape {
    
    constructor(content) {
        this.content = content
        this.position = 0
    }

    alive() {
        return this.position < this.content.length
    }

    peek() {
        const symbol = this.content[this.position]
        return symbol ? symbol : null
    }

    pull() {
        const symbol = this.content[this.position]
        if (symbol) {
            this.position++
            return symbol
        }
        else {
            return null
        }
    }

    expect(symbol) {
        if (this.pull() !== symbol) {
            throw new Error(`Invalid expression at ${this.position}: ${this.content}`)
        }
    }
}

function parseText(tape, stopAt) {
    const exprItems = []
    const buffer = []
    const flushBuffer = () => {
        if (buffer.length > 0) {
            exprItems.push(new Literal(buffer.join('')))

            buffer.length = 0
        }
    }

    while (tape.alive()) {
        // TODO escape char
        if (stopAt && stopAt.indexOf(tape.peek()) !== -1) {
            break;
        }
        else if (tape.peek() === '{') {
            flushBuffer()

            const exprItem = parseExpression(tape)
            
            exprItems.push(exprItem)
        }
        else {
            const symbol = tape.pull()
            
            buffer.push(symbol)
        }
    }

    flushBuffer()

    if (exprItems.length === 1) {
        return exprItems[0]
    }

    return new Concatenation(exprItems)
}

function parseExpression(tape) {
    tape.expect('{')

    let result = parseText(tape, ['}', '('])
    
    if (tape.peek() === '(') {
        const params = []

        tape.pull()

        while (tape.peek() !== ')') {
            const param = parseText(tape, ['}', ')'])

            params.push(param)
        }

        tape.expect(')')

        result = new Invocation(result, params)
    }
    else {
        result = new Getter(result)
    }

    tape.expect('}')

    return result
}

