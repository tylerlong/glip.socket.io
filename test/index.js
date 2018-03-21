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
  console.log('message', type, data)
  if (type === 6) {
    console.log(JSON.stringify(data, null, 2))
    if (data._delta && data._delta.add && data._delta.add.members.indexOf(parseInt(process.env.GLIP_USER_ID)) !== -1) {
      console.log(`I am added to team ${data._id}`)
    }
  }
  if (type === 2 && data.members.length === 2) {
    const user = data.members.filter(m => m + '' !== process.env.GLIP_USER_ID)[0]
    console.log(`${user} just added me to group ${data._id}`)
    // send article from zendesk
  }
})

client.on('event', event => {
  console.log('event', event)
})

client.start()

module.exports = client
