import fs from 'fs'
import lodash from 'lodash'

export function extractKeys(obj, fields) {
    const result = {}

    for (const key of Object.keys(fields)) {
        const value = lodash.get(obj, key)

        if (value !== undefined) {
            result[key] = value
        }
        else {
            const defaultValue = fields[key]

            if (defaultValue === undefined) {
                throw new Error(`Value not found: ${key}`)
            }

            result[key] = defaultValue
        }
    }

    return result
}

export function loadJson(path) {
    const configData = fs.readFileSync(path, 'utf-8')
    
    return JSON.parse(configData)
}