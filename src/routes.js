import * as logger from './logger.js'

function parseRouteConfig(pathConfig) {
    const spaceIndex = pathConfig.indexOf(' ')

    if (spaceIndex === -1) {
        return {
            methods: ['all'],
            path: pathConfig,
        }
    }

    return { 
        methods: pathConfig.substring(0, spaceIndex).split('+').map(m => m.toLowerCase()), 
        path: pathConfig.substring(spaceIndex + 1),
    }
}

export function buildRoutes({ app, callback, config }) {
    const { methods, path } = parseRouteConfig(config)
    const route = app.route(path)

    for (const method of methods) {
        if (!(method in route)) {
            throw new Error(`HTTP method not supported: ${method}`)
        }

        logger.debug(`Creating endpoint: ${method} ${path}...`)

        route[method](callback)
    }
}

