const Discord = require('discord.js')
const moment = require('moment')

const config = require('./config.json')
const command = require('./command.js')

const client = new Discord.Client()
const { namePrefix } = config
const minimumNumberOfUsers = parseInt(config.minimumNumberOfUsers) // inclusive
const namePrefixTimeoutLength = parseInt(config.namePrefixTimeoutLength)

let timers = new Map()
// let channelRoles = new Array()

console.log(`${moment().format()} Starting in ${process.env.NODE_ENV.toUpperCase()}`)

client.on('ready', () => {
    console.log(`${moment().format()} Ready`)

    /* Commands */
    command(client, '', ['(╯°□°）╯︵ ┻━┻'], message => {
        message.channel.send('┬─┬ ノ( ゜-゜ノ)')
    })

    command(client, '!', ['ping'], message => {
        message.channel.send('pong')
    })
})

client.on('voiceStateUpdate', (oldState, newState) => {
    const userLeftChannel = newState.channel === null
    const userJoinedChannel = (oldState.channel != newState.channel) && !userLeftChannel

    if (userJoinedChannel) {
        // if role with current channel name doesn't exist
        //     create role with current channel name
        // assign role to user

        if (!newState.guild.roles.cache.some(role => role.name === newState.channel.name )) {
            newState.guild.roles.create({
                data: {
                    name: newState.channel.name,
                    color: 'BLUE'
                },
                reason: 'Test reason'
            }).then(console.log('success')).catch(console.log('fail'))
        }

        // end of changes here

        const previousChannel = oldState.channel ? ` (moved from ${oldState.channel.name})` : ''
        console.log(`${moment().format()} -> ${memberInfo(newState.member)} joined ${newState.channel.name}${previousChannel}`)

        removeTimerForMember(newState.member)

        if (newState.channel.members.size >= minimumNumberOfUsers) {
            if (!newState.member.displayName.startsWith(namePrefix)) {
                setNicknameForMember(`${namePrefix}${newState.member.displayName}`, newState.member)
            }

            const timer = setTimeout(() => {
                setNicknameForMember(newState.member.displayName.replace(namePrefix, ''), newState.member, () => {
                    removeTimerForMember(newState.member)
                })
            }, namePrefixTimeoutLength)

            timers.set(newState.member, timer)
        } else {
            if (newState.member.displayName.startsWith(namePrefix)) {
                setNicknameForMember(newState.member.displayName.replace(namePrefix, ''), newState.member)
            }
            console.log(`${moment().format()} Minimum number of members in channel is not reached`)
        }
    } else if (userLeftChannel) {
        // remove role

        console.log(`${moment().format()} <- ${memberInfo(newState.member)} left ${oldState.channel.name}`)
        removeTimerForMember(newState.member)

        if (newState.member.displayName.startsWith(namePrefix)) {
            setNicknameForMember(newState.member.displayName.replace(namePrefix, ''), newState.member)
        }

    }
})

client.login(process.env.WAVEBOT_TOKEN)

function memberInfo(member) {
    return `${member.guild.name}: ${member.displayName} (${member.user.tag})`
}

function setNicknameForMember(nickname, member, callback) {
    member.setNickname(nickname).then(message => {
        console.log(`${moment().format()} Set nickname '${nickname}' for member ${member.displayName}`)
        if (typeof callback === 'function' && callback()) callback()
    }).catch(message => {
        console.log(`${moment().format()} Failed to set nickname '${nickname}' for member ${member.displayName}. ${message}`)
        if (typeof callback === 'function' && callback()) callback()
    })
}

function removeTimerForMember(member) {
    if (timers.get(member)) {
        clearTimeout(timers.get(member))
        timers.delete(member)
        console.log(`${moment().format()} Cancelled and removed timer for member ${member.displayName}`)
    }
}

function shutdown(callback) {
    console.log(`${moment().format()} Gracefully shutting down...`)

    const totalNumberOfTimers = timers.size
    let numberOfTimersDeleted = 0

    if (totalNumberOfTimers) {
        console.log(`${moment().format()} ${totalNumberOfTimers} hanging timers found`)
        timers.forEach((value, key) => {
            setNicknameForMember(key.displayName.replace(namePrefix, ''), key, () => {
                removeTimerForMember(key)
                numberOfTimersDeleted++

                if (numberOfTimersDeleted === totalNumberOfTimers) {
                    console.log(`${moment().format()} Shutdown complete`)
                    callback(0)
                    return
                }
            })
        })
    } else {
        console.log(`${moment().format()} No hanging timers found`)
        console.log(`${moment().format()} Shutdown complete`)
        callback(0)
    }
}

process.on('SIGINT', () => {
    shutdown((code) => { process.exit(code) })
})