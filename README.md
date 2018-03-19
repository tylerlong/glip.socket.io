# glip.socket.io

Socket.io client for [Glip](https://glip.com).

Most of the code is copied from [glipbot](https://github.com/jstrinko/glipbot).


## Installation

```
yarn add tylerlong/glip.socket.io
```


## Usage

```javascript
const GlipSocket = require('glip.socket.io')
const client = new GlipSocket({
  host: process.env.GLIP_HOST || 'app.glip.com',
  port: process.env.GLIP_PORT || 443,
  user: process.env.GLIP_EMAIL,
  password: process.env.GLIP_PASSWORD
})
client.on('message', (type, data) => {
  if (type === client.type_ids.TYPE_ID_POST && data.text === 'ping') {
    client.post(data.group_id, 'pong')
  }
})
client.start()
```


## For maintainers

We need to put `dist/` folder into git version control because this NPM package is hosted by GitHub.
