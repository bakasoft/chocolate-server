async function doPost(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {'Content-Type': 'application/json; charset=UTF-8'},
    })

    if (!response.ok) {
        throw new Error()
    }

    return response.json()
}

function postUser(firstName, lastName) {
    defer(async () => {
        await doPost('/users', {
            firstName, lastName
        })
    })
}

function defer(promise) {
    promise().catch(e => alert(e.message))
}

class UserList extends HTMLElement {
    constructor() {
        super()

        this.listElement = document.createElement('ul')

        const shadow = this.attachShadow({mode: 'open'})
        
        shadow.appendChild(this.listElement)
    }

    connectedCallback() {
        this.refreshUsers()
    }

    refreshUsers() {
        defer(async () => {
            const url = this.getAttribute('data-endpoint')
            const response = await fetch(url)
            const users = await response.json()
    
            while (this.listElement.firstChild) {
                this.listElement.removeChild(this.listElement.firstChild)
            }

            for (const user of users) {
                const itemElement = document.createElement('li')
                const anchorElement = document.createElement('a')
    
                anchorElement.textContent = `${user.first_name ?? ''} ${user.last_name ?? ''} (#${user.id})`
    
                itemElement.appendChild(anchorElement)
    
                this.listElement.appendChild(itemElement)
            }
        })
    }
}

customElements.define('user-list', UserList)
