module.exports = {
    apps : [{
        name: "wavebot",
        script: "./index.js",
        watch: true,
        kill_timeout: 3000,
        env: {
            "NODE_ENV": "development"
        },
        env_production: {
            "NODE_ENV": "production"
        }
    }]
}