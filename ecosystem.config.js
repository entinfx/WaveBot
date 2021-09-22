module.exports = {
    apps : [{
        name: "wavebot",
        script: "./index.js",
        watch: true,
        kill_timeout: 3000,
        env: {
            "WAVEBOT_TOKEN": "ODY0OTk1NzQ4MzQ0MzY1MTE2.YO9kEQ.Lu5lbr0WfGi13gX_sH1c0dGct_c",
            "NODE_ENV": "development"
        },
        env_production: {
            "WAVEBOT_TOKEN": "ODY0OTQ5MjI4NTMzOTcyOTky.YO84vg.ZGPUWGCC6daUL-sVf7GklJ9I6bM",
            "NODE_ENV": "production"
        }
    }]
}