exports.tomorrow = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return new Date()
}

exports.yesterday = () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return new Date()
}

exports.now = () => {
    return new Date()
}