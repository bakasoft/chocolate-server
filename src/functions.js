export function tomorrow() {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return new Date()
}

export function yesterday() {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return new Date()
}

export function now() {
    return new Date()
}