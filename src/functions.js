import fs from 'fs'
import lodash from 'lodash'

import { NotFound, ServerError } from './errors.js'

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

export function set(obj, key, value) {
    lodash.set(obj, key, value)
}