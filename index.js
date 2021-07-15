const Discord = require('discord.js')
const client = new Discord.Client()

const namePrefix = '👋'
const namePrefixTimeout = 7000

let timeoutFunction = null

client.on('ready', () => { console.log('Ready.') })

function userInfo(member) {
    return `${member.user.tag} <@!${member.user.id}>`
}

function setNicknameForMember(nickname, member) {
    member.setNickname(nickname).then(message => {
        console.log(`Set nickname '${nickname}' for member ${userInfo(member)}. ${message}`)
    }).catch(message => {
        console.log(`Failed to set nickname '${nickname}' for member ${userInfo(member)}. ${message}`)
    })
}

client.on('voiceStateUpdate', (oldState, newState) => {
    const userLeftChannel = newState.channel === null
    const userJoinedChannel = (oldState.channel != newState.channel) && !userLeftChannel
    const { displayName } = newState.member

    if (userJoinedChannel) {
        console.log(`${newState.member.user.tag} joined '${newState.channel.name}'`)

        clearTimeout(timeoutFunction)

        if (!displayName.startsWith(namePrefix)) {
            setNicknameForMember(`${namePrefix}${displayName}`, newState.member)
        }

        timeoutFunction = setTimeout(() => {
            setNicknameForMember(`${displayName.replace(namePrefix, '')}`, newState.member)
        }, namePrefixTimeout)
    } else if (userLeftChannel) {
        console.log(`${newState.member.user.tag} left '${oldState.channel.name}'`)
        clearTimeout(timeoutFunction)

        if (displayName.startsWith(namePrefix)) {
            setNicknameForMember(`${displayName.replace(namePrefix, '')}`, newState.member)
        }
    }
})

client.login(process.env.WAVEBOT_TOKEN)