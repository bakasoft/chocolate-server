import * as logger from './logger.js'
import * as custom from './custom.js'
import * as functions from './functions.js'

import { extractKeys } from './utils.js'
import { parse } from './expressions.js'


const CONTENT_TYPE_KEY = 'Content-Type'
const JSON_MIME_TYPE = 'application/json'
const TEXT_PLAIN_MIME_TYPE = 'text/plain'

export function buildCallback({ config, serverScope }) {
    const args = extractKeys(config, {
        status: 200,
        context: null,
        content: null,
        headers: null,
    })

    const statusExpr = parse(args.status)
    const contextExpr = parse(args.context)
    const contentExpr = parse(args.content)
    const headersExpr = parse(args.headers)

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
            
            const status = Number(statusExpr.resolve(scope))
            const headers = headersExpr.resolve(scope)
            const content = contentExpr.resolve(scope)

            if (headers) {
                res.set(headers)
            }

            res.status(status).json(content)
    
            if (status >= 200 && status < 300) {
                logger.success(`${$.method} ${$.url} => ${status}`)
            }
            else {
                logger.warning(`${$.method} ${$.url} => ${status}`)
            }
        }
        catch (e) {
            const status = e.statusCode || 500
            logger.error(`${$.method} ${$.url} => ${status}`)
            logger.debug(e.stack)
            res.status(status).json({
                message: String(e.message),
                satck: String(e.stack),
            })
        }
    }
}
