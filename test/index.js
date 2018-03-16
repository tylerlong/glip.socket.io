const dotenv = require('dotenv')
dotenv.config()

const GlipSocket = require('../dist/index')

const client = new GlipSocket({
  host: process.env.GLIP_HOST || 'app.glip.com',
  port: process.env.GLIP_PORT || 443,
  user: process.env.GLIP_EMAIL,
  password: process.env.GLIP_PASSWORD
})

client.on('message', (type, data) => {
  console.log(type, data)
})

client.start()

module.exports = client
