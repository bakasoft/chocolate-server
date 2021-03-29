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

function createServerScope(config) {
  try {
    const args = extractKeys(config, {
      settings: null,
      data: null,
      routes: undefined,
    })

    const scope = {
      settings: args.settings || {},
      data: args.data || {},
      routes: args.routes || {},
    }

    // Sanitize scope values

    if (scope.settings.port === undefined) {
      scope.settings.port = DEFAULT_PORT
    }

    if (scope.settings.cors === undefined) {
      scope.settings.cors = DEFAULT_CORS
    }

    return scope
  } catch (e) {
    logger.debug(e)
    throw new Error(`Server config error! ${e.message}`)
  }
}

function createServerApp(scope) {
  try {
    const app = express()

    // Load mandatory middlewares
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser())

    // Load optional middlewares
    if (scope.settings.cors) {
      logger.info('CORS will be enabled.')
      app.use(cors())
    }

    return app
  } catch (e) {
    logger.debug(e)
    throw new Error(`App instance error! ${e.message}`)
  }
}

function createEndpoints(app, scope) {
  for (const [routeConfig, callbackConfig] of lodash.entries(scope.routes)) {
    try {
      const callback = buildCallback({ config: callbackConfig, serverScope: scope })

      buildRoutes({ app, callback, config: routeConfig })
    } catch (e) {
      logger.debug(e)
      throw new Error(`[${routeConfig}] Route creation error! ${e.message}`)
    }
  }
}

export function buildServer(config) {
  logger.info('Building server...')

  const scope = createServerScope(config)
  const app = createServerApp(scope)

  createEndpoints(app, scope)

  logger.info(`Server listening at ${scope.settings.port}...`)

  app.listen(scope.settings.port, () => {
    logger.info('Ready!')
  })
}
