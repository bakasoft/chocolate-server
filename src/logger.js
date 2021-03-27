const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const DIM = '\x1b[2m'
const END = '\x1b[0m'

exports.debugMode = true

function str(value) {
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2)
    }
    return String(value)
}

exports.debug = (message) => {
    if (exports.debugMode) {
        console.log(`${DIM}${str(message)}${END}`)
    }
}

exports.info = (message) => {
    console.log(`${CYAN}${str(message)}${END}`)
}

exports.success = (message) => {
    console.log(`${GREEN}${str(message)}${END}`)
}

exports.warning = (message) => {
    console.log(`${YELLOW}${str(message)}${END}`)
}

exports.error = (message) => {
    console.log(`${RED}${str(message)}${END}`)
}