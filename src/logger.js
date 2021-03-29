const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const DIM = '\x1b[2m'
const END = '\x1b[0m'

const debugMode = true

function str(value) {
  if (value instanceof Error) {
    return value.stack
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

export function debug(value) {
  if (debugMode) {
    console.log(`${DIM}${str(value)}${END}`)
  }
}

export function info(message) {
  console.log(`${CYAN}${str(message)}${END}`)
}

export function success(message) {
  console.log(`${GREEN}${str(message)}${END}`)
}

export function warning(message) {
  console.log(`${YELLOW}${str(message)}${END}`)
}

export function error(message) {
  console.log(`${RED}${str(message)}${END}`)
}
