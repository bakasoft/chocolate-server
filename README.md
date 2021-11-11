# Chocolate Server

As in the Mexican expression _eres de chocolate_, this server ain't a production-ready server,
it doesn't count. This server is designed to be barely functional, but easy to configure.

## Launch

```shell
# Check your node version, should be >= 15
node --version

# Install dependencies
npm install

# Launch server
npm start -- your_config.json
```

## Configure

Currently only JSON files are supported for configuration files, this is a summary
with all available options:

```json5
{
    "settings": {},         // Server settings
    "state": {},            // Data available for all requests
    "endpoints": {
        "GET /": {          // Method-route configuration
            "setup": [],    // Actions to execute before handling the request
            "data": {},     // Data available only for this request
            "actions": [],  // Actions after context
            "status": 200,  // Status code for the response
            "headers": {},  // Headers for the response
            "response": {}, // Data for sending as the response body
            "cleanup": []   // Actions after the request was sent to the client
        }
    }
}
```

### Settings

Option `settings` can be omitted, otherwise should be a key/value pairs set,
these are the supported keys:

- `port`: Server port for listening requests, default is `8080`.
- `cors`: If CORS is enabled (using `true`) or disabled (using `false`), this
          applies for all request and it's disabled by default.

Settings are available in all requests using the `settings` scope key.

### State

Option `state` is a [Value Expression](#value-expressions) that is resolved 
right after evaluating the settings. 
Resulting value will be available in all requests using the `state` scope key.

This data is stored in main memory so **every time the server restarts, 
all changes will be lost**.

### Endpoints

Option `endpoints` must be a method-route and handler configurations pairs set.
Each pair represents a different endpoint configuration.

#### Method-route

This string value defines the allowed methods and the path pattern for 
matching the requests that the endpoint should handle.
The format can be either `<methods> <path>` or just `<path>`.

- When the `<methods>` part is omitted, the endpoint will allow all methods.
- Otherwise, it can be a list of methods separated by `+`, examples:
  - `GET` → only matches requests with `GET` method.
  - `PUT+POST` → matches requests with `PUT` or `POST` methods.
- The `<path>` should not include query parameters or the fragment.
  It supports path parameters (available under `params` key), examples:
  - `/health-check` → simple path matching.
  - `/user/:id/profile` → matches paths where `:id` can be any non-empty string.
    The value is available using `params.id` key.

The methods and paths are case-insensitive, however, the path parameters are 
taken as they are, example:
- Value `get /FILES` produces the same configuration than `GET /files`.
- Scope key `params.ID` must be used for reading the path parameter defined
  in `GET /user/:ID`.

#### Handler

The endpoint handler is defined by a set of step and value pairs that are 
processed in a specific order to produce a response for the client:

| Order | Step       | Value Type                        | Description
| ----- | ---        | ----------                        | -----------
| 1     | `setup`    | [Function Body](#expr-fn-body)    | **Purpose**: execute actions before the request is processed. <br/> **Example**: you can perform validations in the request, or simulate a delay in the processing.
| 2     | `data`     | [Value Expression](#expr)         | **Purpose**: define the data context of the request. The resulting value will be available after this step using the `data` scope key. <br/> **Example**: you can compute specific values for using them later in the `response`, or set an empty object for updating it in the `actions`.
| 3     | `actions`  | [Function Body](#expr-fn-body)    | **Purpose**: preparation of the `data` for generating the response. <br/> **Example**: you can insert the generated `data` in the global `state` to simulate an insertion, or performs validations over the generated `data`.
| 4     | `status`   | [Value Expression](#expr)         | **Purpose**: HTTP status code for the response. <br/> **Example**: you can set a constant value like `200`, or compute it by using expressions.
| 5     | `headers`  | [Object Expression](#expr-object) | **Purpose**: HTTP header fields for the response. <br/> **Example**: you can change the `Content-Type`, or set cookies.
| 6     | `response` | [Value Expression](#expr)         | **Purpose**: HTTP message body for the response. <br/> **Example**: you can define a complex payload, or omit it to return an empty response.
| 7     | `cleanup`  | [Function Body](#expr-fn-body)    | **Purpose**: execute actions after sending the response. <br/> **Example**: you can delay updates to simulate asynchrounous processing, or maintain counters for statistics.

## Expressions

### <a id="expr-literal"></a> Literals

These expressions are resolved as what they represent:

- `null`
- `true`
- `false`
- `undefined`

### <a id="expr-number"></a> Numbers

See [JSON Number](https://www.json.org/).

### <a id="expr-string"></a> Strings

Must start and end with the same quotation mark that can be either single quote
`'` or double quote `"`.

Embedded values are allowed using the Bash style: wrapping an expression with
`$(` and `)`.

Special symbols can be escaped by writing them twice when they are ambiguous:
- `''` and `""` both produce an empty string.
- `''''` produces a single quote `'` and `""""` produces a double quote `"`.
- `"'x'"` produces produces `'x'`, there is no need to escape the single 
  quotes since they aren't ambiguous, however, `"''"` produces a single quote 
  `'` since the escaping is always accepted.
- `ID: $(id)` produces `ID: 1` when the scope contains `id` with `1` and 
  `ID: $$(id)` produces `ID: $(id)` since the `$` was escaped.
- `$0` produces `$0` indeed, since `$` must be  followed by `(` in order to
  evaluate it, however, `$$0` produces `$0` as well since `$` is escaped.

When a string contains exclusively only one embedded expression, the string
would produce the result of the expression as is -- it won't be converted to 
string:

- `"$(now())"` produces a `Date` object when the scope is `{now: () => new Date()}`.

### <a id="expr-object"></a> Objects



### <a id="expr-array"></a> Arrays

### <a id="expr-function"></a> Functions

```js
{"$": ["sleep(10)", "data.status = 1"], "params": ["a", "b"]}
```

### <a id="expr-fn-body"></a> Function Body

## Scope

### Global Scope

### Request Scope

## Dependencies

- [Express 4.x](http://expressjs.com/en/api.html)