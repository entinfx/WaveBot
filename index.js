const Discord = require('discord.js')
const client = new Discord.Client()

const moment = require('moment')

const config = require('./config.json')
const { namePrefix } = config
const namePrefixTimeoutLength = parseInt(config.namePrefixTimeoutLength)

let timers = new Map()

client.on('ready', () => { console.log('Ready.') })

function memberInfo(member) {
    return `${member.guild.name}: ${member.displayName} (${member.user.tag})`
}

function setNicknameForMember(nickname, member) {
    member.setNickname(nickname).then(message => {
        console.log(`${moment().format()} -> Set nickname '${nickname}' for member ${member.displayName}. ${message}`)
    }).catch(message => {
        console.log(`${moment().format()} -x Failed to set nickname '${nickname}' for member ${member.displayName}. ${message}`)
    })
}

function shutdown() {
    console.log('-! Gracefully shutting down. Removing nickname prefixes...')

    timers.forEach((value, key) => {
        setNicknameForMember(`${key.displayName.replace(namePrefix, '')}`, key)
        timers.delete(key)
    })
}

client.on('voiceStateUpdate', (oldState, newState) => {
    const userLeftChannel = newState.channel === null
    const userJoinedChannel = (oldState.channel != newState.channel) && !userLeftChannel
    const { displayName } = newState.member

    if (userJoinedChannel) {
        if (!oldState.channel) {
            console.log(`${moment().format()} ${memberInfo(newState.member)} joined ${newState.channel.name}`)
        } else {
            console.log(`${moment().format()} ${memberInfo(newState.member)} moved to ${newState.channel.name} from ${oldState.channel.name}`)
        }

        if (timers.get(newState.member)) {
            clearTimeout(timers.get(newState.member))
            timers.delete(newState.member)
        }

        if (!displayName.startsWith(namePrefix)) {
            setNicknameForMember(`${namePrefix}${displayName}`, newState.member)
        }

        let timer = setTimeout(() => {
            setNicknameForMember(`${displayName.replace(namePrefix, '')}`, newState.member)
        }, namePrefixTimeoutLength)

        timers.set(newState.member, timer)
    } else if (userLeftChannel) {
        console.log(`${moment().format()} ${memberInfo(newState.member)} left ${oldState.channel.name}`)

        if (timers.get(newState.member)) {
            clearTimeout(timers.get(newState.member))
            timers.delete(newState.member)
        }

        if (displayName.startsWith(namePrefix)) {
            setNicknameForMember(`${displayName.replace(namePrefix, '')}`, newState.member)
        }
    }
})

client.login(process.env.WAVEBOT_TOKEN)