const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const lodash = require('lodash')

const validations = require('./validations')
const logger = require('./logger')
const routes = require('./routes')
const callbacks = require('./callbacks')

const DEFAULT_PORT = 8080
const DEFAULT_CORS = true

function sanitizeSettings(settings) {
    if (settings.port === undefined) {
        settings.port = DEFAULT_PORT
    }
    
    if (settings.cors === undefined) {
        settings.cors = DEFAULT_CORS
    }
}

exports.build = (config) => {
    logger.info(`Building server...`)

    const app = express()

    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser())

    const args = validations.extract(config, {
        settings: null,
        data: null,
        routes: undefined,
    })

    const settings = args.settings || {}

    sanitizeSettings(settings)

    if (settings.cors) {
        logger.info('CORS will be enabled.')
        app.use(cors())
    }

    const serverScope = {
        settings,
        data: args.data || {},
    }

    for (const [routeConfig, callbackConfig] of lodash.entries(args.routes)) {
        const callback = callbacks.build({ config: callbackConfig, serverScope })

        routes.build({ app, callback, config: routeConfig })
    }

    logger.info(`Server listening at ${settings.port}...`)

    app.listen(settings.port)
}
