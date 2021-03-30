import * as logger from './logger.js'
import * as custom from './custom.js'
import * as functions from './functions.js'

import { extractKeys } from './utils.js'
import { parseValue, parseActions } from './expressions.js'

const CONTENT_TYPE_KEY = 'Content-Type'
const JSON_MIME_TYPE = 'application/json'

export function buildCallback({ config, serverScope }) {
  const args = extractKeys(config, {
    setup: null,
    context: null,
    actions: null,
    status: 200,
    headers: null,
    response: null,
    cleanup: null,
  })

  const setupExpr = parseActions(args.setup)
  const contextExpr = parseValue(args.context)
  const actionsExpr = parseActions(args.actions)
  const statusExpr = parseValue(args.status)
  const headersExpr = parseValue(args.headers)
  const responseExpr = parseValue(args.response)
  const cleanupExpr = parseActions(args.cleanup)

  return async (req, res) => {
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
      await setupExpr.resolve(scope)

      scope.context = await contextExpr.resolve(scope)

      await actionsExpr.resolve(scope)

      scope.status = await statusExpr.resolve(scope)
      scope.headers = await headersExpr.resolve(scope)
      scope.response = await responseExpr.resolve(scope)

      if (scope.headers) {
        res.set(scope.headers)
      }

      const contentType = res.get(CONTENT_TYPE_KEY)

      if (contentType == null || contentType === JSON_MIME_TYPE) {
        res.status(scope.status).json(scope.response)
      } else {
        res.status(scope.status).send(scope.response)
      }

      if (scope.status >= 200 && scope.status < 300) {
        logger.success(`${scope.method} ${scope.url} => ${scope.status}`)
      } else {
        logger.warning(`${scope.method} ${scope.url} => ${scope.status}`)
      }
    }
    catch (e) {
      logger.debug(e)

      scope.status = e.statusCode || 500

      logger.error(`${scope.method} ${scope.url} => ${scope.status}`)

      res.status(scope.status).json({
        message: String(e.message),
        satck: String(e.stack).split('\n'),
      })
    }
    
    try {
      await cleanupExpr.resolve(scope)
    }
    catch (e) {
      logger.error(e)
    }
  }
}
