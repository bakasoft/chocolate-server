import lodash from 'lodash'

import * as logger from './logger.js'
import { NotFound, ServerError } from './errors.js'

export class Literal {
  constructor(value) {
    this.value = value
    this.type = 'Literal'
  }

  async resolve() {
    return this.value
  }
}

export class GetterDynamic {
  constructor(expr) {
    this.expr = expr
    this.type = 'GetterDynamic'
  }

  async resolve(scope) {
    const key = await this.expr.resolve(scope)

    if (typeof key !== 'string') {
      throw new ServerError(`Invalid resource key: ${this.expr.type} => ${this.key}`)
    } else if (key === '.') {
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

  async resolve(scope) {
    const parts = []

    for (const exprItem of this.exprItems) {
      const part = await exprItem.resolve(scope)

      parts.push(part)
    }

    return parts.join('')
  }
}

export class Mapper {
  constructor(exprMap) {
    this.exprMap = exprMap
    this.type = 'Mapper'
  }

  async resolve(scope) {
    const result = {}

    for (const key of Object.keys(this.exprMap)) {
      result[key] = await this.exprMap[key].resolve(scope)
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

  async resolve(scope) {
    const fn = await this.exprFunction.resolve(scope)

    if (fn === undefined || fn === null) {
      throw new NotFound(`Function not found`)
    } 
    else if (typeof fn !== 'function') {
      throw new ServerError(`Resource is not a function`)
    }

    const argumentValues = []

    for (const exprParameter of this.exprParameters) {
      const argumentValue = await exprParameter.resolve(scope)

      argumentValues.push(argumentValue)
    }
    
    return fn(...argumentValues)
  }
}

export class Actions {
  constructor(exprItems) {
    this.exprItems = exprItems
    this.type = 'Actions'
  }

  async resolve(scope) {
    for (let i = 0; i < this.exprItems.length; i++) {
      const exprItem = this.exprItems[i]
      try {
        await exprItem.resolve(scope)
      } catch (e) {
        logger.debug(e)
        throw new ServerError(`[Action ${i}] ${e.message}`)
      }
    }
  }
}



export const SCOPE_GETTER = (scope) => scope


export class GetterStatic {

  constructor(key) {
    this.key = key
    this.type = 'GetterStatic'
  }

  async resolve(scope) {
    const value = scope[this.key]

    if (value === undefined) {
      throw new ServerError(`Cannot get ${this.key} from ${value}`)
    }

    return value
  }

}


export class GetterNestedStatic {

  constructor(expression, key) {
    this.expression = expression
    this.key = key
    this.type = 'GetterNestedStatic'
  }

  async resolve(scope) {
    const value = await this.expression.resolve(scope)

    if (value === undefined || value === null) {
      throw new ServerError(`Cannot get ${this.key} from ${value}`)
    }

    return value[this.key]
  }

}


export class GetterNestedDynamic {

  constructor(valueExpression, keyExpression) {
    this.valueExpression = valueExpression
    this.keyExpression = keyExpression
    this.type = 'GetterNestedDynamic'
  }

  async resolve(scope) {
    const key = await this.keyExpression.resolve(scope)

    if (key === undefined || key === null) {
      throw new ServerError(`Missing key`)
    }

    const value = await this.valueExpression.resolve(scope)

    if (value === undefined || value === null) {
      throw new ServerError(`Cannot get ${key} from ${value}`)
    }

    return value[key]
  }

}