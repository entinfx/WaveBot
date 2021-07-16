# WaveBot
## Discord bot that encourages people to say hi 👋 to each other!

WaveBot temporarily adds a marker to user's nickname when they join a voice channel.

### Usage
```bash
$ npm install
$ WAVEBOT_TOKEN=your_discord_bot_token node index.js
```

### TODO
* Add timestamps to console logs
* Add command interface to set prefix string, clear all nicknames
* Graceful shutdown (e.g. reset nicknames on shutdown)