import * as logger from './logger.js'
import * as custom from './custom.js'
import * as functions from './functions.js'

import { extractKeys } from './utils.js'
import { parseValue, parseActions } from './expressions.js'


const CONTENT_TYPE_KEY = 'Content-Type'
const JSON_MIME_TYPE = 'application/json'

export function buildCallback({ config, serverScope }) {
    const args = extractKeys(config, {
        status: 200,
        context: null,
        actions: null,
        response: null,
        headers: null,
    })

    const statusExpr = parseValue(args.status)
    const contextExpr = parseValue(args.context)
    const actionsExpr = parseActions(args.actions)
    const responseExpr = parseValue(args.response)
    const headersExpr = parseValue(args.headers)

    return (req, res) => {
        const scope = {
            ...functions,

            settings: serverScope.settings,
            data: serverScope.data,
            routes: serverScope.routes,
            
            url: req.originalUrl,
            route: req.route.path,
            method: req.method,
            hostname: req.hostname,
    
            body: req.body,
            params: req.params,
            query: req.query,
            cookies: req.cookies,
            context: undefined,

            ...custom,
        }
        try {
            // Bring context data to scope
            scope.context = contextExpr.resolve(scope)
            
            actionsExpr.resolve(scope)

            const status = Number(statusExpr.resolve(scope))
            const headers = headersExpr.resolve(scope)
            const response = responseExpr.resolve(scope)

            if (headers) {
                res.set(headers)
            }

            const contentType = res.get(CONTENT_TYPE_KEY)

            if (contentType == null || contentType === JSON_MIME_TYPE) {
                res.status(status).json(response)
            }
            else {
                res.status(status).send(response)
            }
    
            if (status >= 200 && status < 300) {
                logger.success(`${scope.method} ${scope.url} => ${status}`)
            }
            else {
                logger.warning(`${scope.method} ${scope.url} => ${status}`)
            }
        }
        catch (e) {
            logger.debug(e)
            
            const status = e.statusCode || 500

            logger.error(`${scope.method} ${scope.url} => ${status}`)

            res.status(status).json({
                message: String(e.message),
                satck: String(e.stack),
            })
        }
    }
}
