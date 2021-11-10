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

// console.log(`${moment().format()} Starting in ${process.env.NODE_ENV.toUpperCase()}`)

client.on('ready', () => {
    console.log(`${moment().format()} Ready`)

    /* Commands */
    command(client, '', ['(╯°□°）╯︵ ┻━┻'], message => {
        message.channel.send('┬─┬ ノ( ゜-゜ノ)')
    })

    command(client, '!', ['countdown'], message => {
        message.channel.send(moment().to([2021, 9, 28]))
    })
})

client.on('voiceStateUpdate', (oldState, newState) => {
    const userLeftChannel = newState.channel === null
    const userJoinedChannel = (oldState.channel != newState.channel) && !userLeftChannel
    const previousChannel = oldState.channel ? ` (moved from ${oldState.channel.name})` : ''

    if (userJoinedChannel) {
        console.log(`${moment().format()} -> ${memberInfo(newState.member)} joined ${newState.channel.name}${previousChannel}`)

        // Bandaid cause I cba it's 5 in the morning
        // TODO: Clean up old toles on channel switch. The 'userLeftChannel' branch doesn't fire
        //       on channel switch, only on full leave
        if (oldState.channel) {
            const oldRole = newState.member.guild.roles.cache.find(role => role.name === oldState.channel.name)
            if (oldRole) {
                newState.member.roles.remove(oldRole)
                console.log(`${moment().format()} Removed role ${oldRole.name} from ${memberInfo(newState.member)}`)
            }
        }

        /* Create pingable channel role on user join channel */
        // WARNING: First ID in config contains test server ID. Check before pushing in production!
        // TODO: * Make roles pingable only by subs
        //       * Store role ID's and users in a map
        //       * Cleanup function: remove roles from users, probably delete roles as well
        if (config.whitelistedChannelIDsForPingableRole.includes(newState.channel.id)) {
            if (!newState.guild.roles.cache.some(role => role.name === newState.channel.name)) {
                newState.guild.roles.create({
                    data: {
                        name: newState.channel.name,
                        color: 'RED',
                        permissions: 0,
                        mentionable: true
                    },
                    reason: 'User joined channel whitelisted for role creation'
                }).then(() => {
                    const role = newState.member.guild.roles.cache.find(role => role.name === newState.channel.name)
                    newState.member.roles.add(role)
                    console.log(`${moment().format()} Created role ${role.name} and assigned to ${memberInfo(newState.member)}`)
                }).catch(() => {
                    console.log(`${moment().format()} Failed to create role for channel`)
                })
            } else {
                const role = newState.member.guild.roles.cache.find(role => role.name === newState.channel.name)
                newState.member.roles.add(role)
                console.log(`${moment().format()} Assigned existing role ${role.name} to member ${memberInfo(newState.member)}`)
            }
        }

        /* Change name on user join channel */
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
        console.log(`${moment().format()} <- ${memberInfo(newState.member)} left ${oldState.channel.name}`)
        removeTimerForMember(newState.member)

        /* Remove pingable channel role from user on channel leave */
        const role = newState.member.guild.roles.cache.find(role => role.name === oldState.channel.name)
        if (role) {
            newState.member.roles.remove(role)
            console.log(`${moment().format()} Removed role ${role.name} from ${memberInfo(newState.member)}`)
        } else {
            console.log(`${moment().format()} No channel role found to remove for ${memberInfo(newState.member)}`)
        }

        /* Remove name prefix on channel leave */
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