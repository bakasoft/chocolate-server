const fs = require('fs')

exports.args = (obj, description) => {
    const usedKeys = []

    return {
        get(key, defaultValue) {
            if (usedKeys.indexOf(key) == -1) {
                usedKeys.push(key)
            }

            const value = obj[key]

            if (value === undefined || value === null) {
                if (defaultValue === undefined) {
                    throw new Error(`Missing key: '${key}' (${description})`)
                }

                return defaultValue
            }

            return value
        },
        rejectUnknownKeys() {
            for (const key of Object.keys(obj)) {
                if (usedKeys.indexOf(key) === -1) {
                    throw new Error(`Unknown key: '${key}' (${description})`)
                }
            }
        }
    }
}

exports.loadJson = (path) => {
    const configData = fs.readFileSync(path, 'utf-8')
    
    return JSON.parse(configData)
}

exports.entries = (obj) => {
    if (obj == null) {
        return []
    }
    return Object.keys(obj).map(key => [key, obj[key]])
}