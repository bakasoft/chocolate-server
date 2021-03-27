import lodash from 'lodash'

import * as errors from './errors.js'

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

class Literal {

    constructor(value) {
        this.value = value
        this.type = 'Literal'
    }

    resolve() {
        return this.value
    }

}

class Getter {

    constructor(expr) {
        this.expr = expr
        this.type = 'Getter'
    }

    resolve(scope) {
        const key = this.expr.resolve(scope)
        const value = lodash.get(scope, key)

        if (value === undefined) {
            throw new errors.NotFound(`Resource not found: ${key}`)
        }

        return value
    }

}

class Concatenation {

    constructor(exprItems) {
        this.exprItems = exprItems
        this.type = 'Concatenation'
    }

    resolve(scope) {
        return this.exprItems.map(exprItem => exprItem.resolve(scope)).join('')
    }

}

class Mapper {

    constructor(exprMap) {
        this.exprMap = exprMap
        this.type = 'Mapper'
    }

    resolve(scope) {
        const result = {}

        for (const key of Object.keys(this.exprMap)) {
            result[key] = this.exprMap[key].resolve(scope)
        }

        return result
    }

}

class Invocation {

    constructor(exprFunction, exprParameters) {
        this.exprFunction = exprFunction
        this.exprParameters = exprParameters
        this.type = 'Invocation'
    }

    resolve(scope) {
        const functionKey = this.exprFunction.resolve(scope)
        const argumentValues = this.exprParameters.map(exprParameter => exprParameter.resolve(scope))
        const fn = lodash.get(scope, functionKey)

        if (fn === undefined) {
            throw new errors.NotFound(`Resource not found: ${functionKey}`)   
        }
        else if (typeof fn !== "function") {
            throw new errors.ServerError(`Resource is not a function: ${functionKey}`)
        }

        return fn(...argumentValues)
    }

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
            throw new errors.InvalidExpression(`Invalid expression at ${this.position}: ${this.content}`)
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

