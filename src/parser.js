exports.parseMethods = (text) => {
    if (text == null) {
        return ['all']
    }

    const methods = []

    for (const rawMethod of text.split(',')) {
        const method = rawMethod.trim().toLowerCase()

        if (method === '' || method === '*') {
            methods.push('all')
        }
        else {
            methods.push(method)
        }
    }

    return methods
}