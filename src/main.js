import { buildServer } from './servers.js'
import { loadJson } from './utils.js'
import * as logger from './logger.js'

const configPath = (process.argv[2] || 'configs/example.json')

logger.info(`Loading configuration '${configPath}'...`)

try {
    const config = loadJson(configPath)

    buildServer(config)    
}
catch (e) {
    logger.debug(e)
    logger.error(String(e))
}
