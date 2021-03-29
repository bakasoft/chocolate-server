import fs from 'fs'

export function extractKeys(obj, keyDefaultMap) {
  const allowedKeys = Object.keys(keyDefaultMap)
  const result = {}

  for (const key of allowedKeys) {
    const value = obj[key]

    if (value !== undefined) {
      result[key] = value
    } else {
      const defaultValue = keyDefaultMap[key]

      if (defaultValue === undefined) {
        throw new Error(`Value not found: ${key}`)
      }

      result[key] = defaultValue
    }
  }

  for (const key of Object.keys(obj)) {
    if (allowedKeys.indexOf(key) === -1) {
      throw new Error(`Key '${key}' is not supported. Allowed keys: ${allowedKeys.join(', ')}`)
    }
  }

  return result
}

export function loadJson(path) {
  try {
    const configData = fs.readFileSync(path, 'utf-8')

    return JSON.parse(configData)
  } catch (e) {
    throw new Error(`[${path}] ${e.message}`)
  }
}

export function q(value) {
  return JSON.stringify(value)
}
