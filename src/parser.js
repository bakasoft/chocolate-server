const lodash = require('lodash')
const utils = require('./utils')
const errors = require('./errors')

class Literal {

    constructor(value) {
        this.value = value
    }

    resolve() {
        return this.value
    }

}

class Getter {

    constructor(expr) {
        this.expr = expr
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

class Concatenator {

    constructor(exprItems) {
        this.exprItems = exprItems
    }

    resolve(scope) {
        return this.exprItems.map(exprItem => exprItem.resolve(scope)).join()
    }

}

class Mapper {

    constructor(exprMap) {
        this.exprMap = exprMap
    }

    resolve(scope) {
        const result = {}

        for (const key of Object.keys(this.exprMap)) {
            result[key] = this.exprMap[key].resolve(scope)
        }

        return result
    }

}

function parseValue(value) {
    const type = typeof value

    if (type === 'object' && value !== null && value !== undefined) {
        return parseObject(value)
    }
    else if (type === 'string') {
        return parseString(value)
    }

    return new Literal(value)
}

function parseString(str) {
    const openIndex = str.indexOf('{')
    const closeIndex = str.indexOf('}', openIndex)

    if (openIndex === -1 || closeIndex === -1) {
        // Return as is
        return new Literal(str)
    }

    const key = str.substring(openIndex+1, closeIndex)

    // TODO
    return new Getter(new Literal(key))
}

function parseObject(obj) {
    const template = {}
    const keys = Object.keys(obj)
    for (const key of keys) {
        template[key] = parseValue(obj[key])
    }

    return new Mapper(template)
}

function parseActions(actions) {
    return {
        resolve(scope) {
            // TODO
        }
    }
}

Object.assign(exports, { parseValue, parseActions })

exports.parseMethods = (text) => {
    if (text == null) {
        return ['all']
    }

    const methods = []

    for (const rawMethod of text.split(',')) {
        const method = rawMethod.trim().toLowerCase()

        if (method === '' || method === '*') {
            methods.push('all')
        }
        else {
            methods.push(method)
        }
    }

    return methods
}