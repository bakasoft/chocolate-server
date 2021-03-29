import lodash from 'lodash'

import * as logger from './logger.js'
import { NotFound, ServerError } from './errors.js'

export class Literal {

    constructor(value) {
        this.value = value
        this.type = 'Literal'
    }

    resolve() {
        return this.value
    }

}

export class Getter {

    constructor(expr) {
        this.expr = expr
        this.type = 'Getter'
    }

    resolve(scope) {
        const key = this.expr.resolve(scope)

        if (typeof key !== 'string') {
            throw new ServerError(`Invalid resource key: ${this.expr.type} => ${this.key}`)
        }
        else if (key === '.') {
            return scope
        }

        const value = lodash.get(scope, key)

        if (value === undefined) {
            throw new NotFound(`Resource not found: ${key}`)
        }

        return value
    }

}

export class Concatenation {

    constructor(exprItems) {
        this.exprItems = exprItems
        this.type = 'Concatenation'
    }

    resolve(scope) {
        return this.exprItems.map(exprItem => exprItem.resolve(scope)).join('')
    }

}

export class Mapper {

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

export class Invocation {

    constructor(exprFunction, exprParameters) {
        this.exprFunction = exprFunction
        this.exprParameters = exprParameters
        this.type = 'Invocation'
    }

    resolve(scope) {
        const functionKey = this.exprFunction.resolve(scope)

        if (typeof functionKey !== 'string') {
            throw new ServerError(`Invalid function key: ${this.exprFunction.type} => ${functionKey}`)
        }

        const argumentValues = this.exprParameters.map(exprParameter => exprParameter.resolve(scope))
        const fn = lodash.get(scope, functionKey)

        if (fn === undefined) {
            throw new NotFound(`Function not found: ${functionKey}`)   
        }
        else if (typeof fn !== "function") {
            throw new ServerError(`Resource is not a function: ${functionKey}`)
        }

        return fn(...argumentValues)
    }

}

export class Actions {

    constructor(exprItems) {
        this.exprItems = exprItems
    }

    resolve(scope) {
        this.exprItems.forEach((exprItem, index) => {
            try {
                exprItem.resolve(scope)
            }
            catch (e) {
                logger.debug(e)
                throw new ServerError(`[Action ${index}] ${e.message}`)
            }
        })
    }

}