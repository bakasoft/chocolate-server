import { parseExpression, parseInstruction } from './parser.js'
import { Literal, Mapper, Actions } from './resolvers.js'

export function parseValue(value) {
  const type = typeof value

  if (type === 'object' && value !== null && value !== undefined) {
    return parseObjectOrArray(value)
  }
  if (type === 'string') {
    return parseExpression(value)
  }

  // Boolean, Number, null, undefined, etc... goes here
  return new Literal(value)
}

export function parseActions(value) {
  if (value && value.length > 0) {
    const items = []

    for (const item of value) {
      if (typeof item !== 'string') {
        throw new Error()
      }

      const instr = parseInstruction(item)

      if (instr === null) {
        throw new Error()
      }

      items.push(instr)
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
