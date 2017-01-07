# glip.socket.io

Socket.io client for [Glip](https://glip.com).

Most of the code is copied from [glipbot](https://github.com/jstrinko/glipbot).


## Installation

```
yarn add glip.socket.io
```


## Usage

```javascript
const GlipSocket = require('glip.socket.io')
const client = new GlipSocket({
  host: process.env.HUBOT_GLIP_HOST || 'glip.com',
  port: process.env.HUBOT_GLIP_PORT || 443,
  user: process.env.HUBOT_GLIP_EMAIL,
  password: process.env.HUBOT_GLIP_PASSWORD
})
client.on('message', (type, data) => {
  if (type === this.client.type_ids.TYPE_ID_POST && data.text === 'ping') {
    client.post(data.group_id, 'pong')
  }
})
```
