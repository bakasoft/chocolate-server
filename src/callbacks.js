import * as logger from './logger.js'
import * as custom from './custom.js'
import * as functions from './functions.js'

import { extractKeys } from './utils.js'
import { parseValue } from './expressions.js'


const CONTENT_TYPE_KEY = 'Content-Type'
const JSON_MIME_TYPE = 'application/json'
const TEXT_PLAIN_MIME_TYPE = 'text/plain'

export function buildCallback({ config, serverScope }) {
    const args = extractKeys(config, {
        status: 200,
        context: null,
        actions: null,
        content: null,
        headers: null,
    })

    const statusExpr = parseValue(args.status)
    const contextExpr = parseValue(args.context)
    const actionsExpr = parseValue(args.actions)
    const contentExpr = parseValue(args.content)
    const headersExpr = parseValue(args.headers)

    return (req, res) => {
        const $ = {
            ...serverScope,
            ...functions,
            ...custom,
            
            url: req.originalUrl,
            route: req.route.path,
            method: req.method,
            hostname: req.hostname,
    
            body: req.body,
            params: req.params,
            query: req.query,
            cookies: req.cookies,
        }
        try {
            const scope = { $ }

            // Bring context data to scope
            const context = contextExpr.resolve(scope)
            if (context) {
                Object.assign(scope, context)
            }
            
            actionsExpr.resolve(scope)

            const status = Number(statusExpr.resolve(scope))
            const headers = headersExpr.resolve(scope)
            const content = contentExpr.resolve(scope)

            if (headers) {
                res.set(headers)
            }

            const contentType = res.get(CONTENT_TYPE_KEY)

            if (contentType == null || contentType === JSON_MIME_TYPE) {
                res.status(status).json(content)
            }
            else {
                res.status(status).send(content)
            }
    
            if (status >= 200 && status < 300) {
                logger.success(`${$.method} ${$.url} => ${status}`)
            }
            else {
                logger.warning(`${$.method} ${$.url} => ${status}`)
            }
        }
        catch (e) {
            logger.debug(e)
            
            const status = e.statusCode || 500

            logger.error(`${$.method} ${$.url} => ${status}`)

            res.status(status).json({
                message: String(e.message),
                satck: String(e.stack),
            })
        }
    }
}
