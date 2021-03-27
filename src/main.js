const servers = require('./servers')
const utils = require('./utils')
const logger = require('./logger')

const configPath = (process.argv[2] || 'configs/example.json')

logger.info(`Loading configuration '${configPath}'...`)

try {
    const config = utils.loadJson(configPath)

    servers.build(config)    
}
catch (e) {
    logger.error(`FATAL ERROR! ${e}`)
    logger.debug(e.stack)
}
