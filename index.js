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

function setNicknameForMember(nickname, member, callback) {
    member.setNickname(nickname).then(message => {
        console.log(`${moment().format()} Set nickname '${nickname}' for member ${member.displayName}. ${message}`)
        if (typeof callback === 'function' && callback()) callback()
    }).catch(message => {
        console.log(`${moment().format()} Failed to set nickname '${nickname}' for member ${member.displayName}. ${message}`)
        if (typeof callback === 'function' && callback()) callback()
    })
}

client.on('voiceStateUpdate', (oldState, newState) => {
    const userLeftChannel = newState.channel === null
    const userJoinedChannel = (oldState.channel != newState.channel) && !userLeftChannel
    const { displayName } = newState.member

    if (userJoinedChannel) {
        if (!oldState.channel) {
            console.log(`${moment().format()} -> ${memberInfo(newState.member)} joined ${newState.channel.name}`)
        } else {
            console.log(`${moment().format()} -> ${memberInfo(newState.member)} moved to ${newState.channel.name} from ${oldState.channel.name}`)
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
            timers.delete(newState.member)
        }, namePrefixTimeoutLength)

        timers.set(newState.member, timer)
    } else if (userLeftChannel) {
        console.log(`${moment().format()} <- ${memberInfo(newState.member)} left ${oldState.channel.name}`)

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

/* Graceful shutdown */
function shutdown(callback) {
    const totalNumberOfTimers = timers.size
    let numberOfTimersDeleted = 0

    if (totalNumberOfTimers) {
        console.log(`${totalNumberOfTimers} hanging timers found, cleaning up...`)
        timers.forEach((value, key) => {
            setNicknameForMember(`${key.displayName.replace(namePrefix, '')}`, key, () => {
                timers.delete(key)
                numberOfTimersDeleted++

                if (numberOfTimersDeleted === totalNumberOfTimers) {
                    callback(0)
                    return
                }
            })
        })
    } else {
        console.log(`No hanging timers found.`)
        callback(0)
    }
}

process.on('SIGINT', () => {
    console.log('Gracefully shutting down...')
    shutdown((code) => {
        console.log(`Shutdown complete.`)
        process.exit(code)
    })
})