exports.NotFound = class extends Error {

    constructor(message) {
        super(message)
        this.statusCode = 404
    }

}

exports.InvalidExpression = class extends Error {

    constructor(message) {
        super(message)
        this.statusCode = 500
    }

}