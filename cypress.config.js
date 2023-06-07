const { defineConfig } = require('cypress')

module.exports = defineConfig({
    projectId: "v95j5v",
    e2e: {
        baseUrl: 'http://localhost:4000',
    },
})