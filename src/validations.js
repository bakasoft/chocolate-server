const lodash = require('lodash')

exports.extract = (obj, fields) => {
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