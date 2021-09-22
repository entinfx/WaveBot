module.exports = {
    apps : [{
        name: "wavebot",
        script: "./index.js",
        watch: true,
        kill_timeout: 3000,
        env: {
            "WAVEBOT_TOKEN": "ODY0OTk1NzQ4MzQ0MzY1MTE2.YO9kEQ.b94AZL4FS_MDRIAyGiWFzcYt2cA",
            "NODE_ENV": "development"
        },
        env_production: {
            "WAVEBOT_TOKEN": "ODY0OTQ5MjI4NTMzOTcyOTky.YO84vg.65cNbETaeS5PrK5w5sE1Lnp4lQU",
            "NODE_ENV": "production"
        }
    }]
}