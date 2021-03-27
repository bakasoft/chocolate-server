import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import lodash from 'lodash'

import * as logger from './logger.js'
import { extractKeys } from './utils.js'
import { buildRoutes } from './routes.js'
import { buildCallback } from './callbacks.js'

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

export function buildServer(config) {
    logger.info(`Building server...`)

    const args = extractKeys(config, {
        settings: null,
        data: null,
        routes: undefined,
    })

    const settings = args.settings || {}

    sanitizeSettings(settings)

    const app = express()

    // Load mandatory middlewares
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser())

    // Load optional middlewares
    if (settings.cors) {
        logger.info('CORS will be enabled.')
        app.use(cors())
    }

    const serverScope = {
        settings,
        data: args.data || {},
    }

    for (const [routeConfig, callbackConfig] of lodash.entries(args.routes)) {
        const callback = buildCallback({ config: callbackConfig, serverScope })

        buildRoutes({ app, callback, config: routeConfig })
    }

    logger.info(`Server listening at ${settings.port}...`)

    app.listen(settings.port)
}
