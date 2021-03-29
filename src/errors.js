export class NotFound extends Error {

    constructor(message) {
        super(message)
        this.statusCode = 404
    }

}

export class ServerError extends Error {

    constructor(message) {
        super(message)
        this.statusCode = 500
    }

}

export class Conflict extends Error {

    constructor(message) {
        super(message)
        this.statusCode = 409
    }

}
