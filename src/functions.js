import fs from 'fs'
import lodash from 'lodash'

import { NotFound, ServerError, Conflict } from './errors.js'

export function tomorrow() {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return new Date()
}

export function yesterday() {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return new Date()
}

export function now() {
    return new Date()
}

export function file(path) {
    try {
        return fs.readFileSync(path)
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            throw new NotFound(e.message)
        }
        else {
            throw new ServerError(e.message)
        }
    }
}

export function keys(value) {
    return Object.keys(value)
}

export function size(value) {
    return lodash.size(value)
}

export function str(value) {
    return String(value)
}

function validateObject(obj) {
    if (typeof obj !== 'object') {
        throw new ServerError(`Invalid object: ${obj}`)
    }
}

function validateKey(key) {
    if (typeof key !== 'string' && typeof key !== 'number') {
        throw new ServerError(`Invalid resource key: ${key} (${typeof key})`)
    }
}

export function put(obj, key, value) {
    validateObject(obj)
    validateKey(key)

    lodash.set(obj, key, value)
}

export function set(obj, key, value) {
    validateObject(obj)
    validateKey(key)

    if (lodash.get(obj, key) !== undefined) {
        throw new Conflict(`Resource already exists: ${key}`)
    }

    lodash.set(obj, key, value)
}

export function add(array, item) {
    validateObject(array)
    
    if (array.push !== 'function') {
        throw new ServerError(`Invalid array: ${array}`)
    }

    array.push(item)
}

export function inc(obj, key) {
    validateObject(obj)
    validateKey(key)

    const value = lodash.get(obj, key) + 1

    lodash.set(obj, key, value)

    return value
}

export function dec(obj, key) {
    validateObject(obj)
    validateKey(key)

    const value = lodash.get(obj, key) - 1

    lodash.set(obj, key, value)

    return value
}

export function search(array, key, expected) {
    validateKey(key)

    if (array && array.length > 0) {
        for (const item of array) {
            validateObject(item)

            const actual = lodash.get(item, key)

            if (actual == expected) {
                return item
            }
        }
    }

    return null
}