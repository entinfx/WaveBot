module.exports = (client, prefix, aliases, callback) => {
    client.on('message', message => {
        const { content } = message

        aliases.forEach(alias => {
            const command = `${prefix}${alias}`

            if (content.startsWith(command) || content === command) {
                callback(message)
                return
            }
        })
    })
}