export class NotFound extends Error {

    constructor(message) {
        super(message)
        this.statusCode = 404
    }

}

export class InvalidExpression extends Error {

    constructor(message) {
        super(message)
        this.statusCode = 500
    }

}