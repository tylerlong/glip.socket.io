const client = require('./index')

client.on('started', () => {
  client.request(
    '/api/post/3930525409284',
    'PUT',
    {
      'text': 'test',
      '_id': 3930525409284,
      'likes': [
        4374470659
      ]
    },
    (error, data) => {
      console.warn(error, data)
      console.log(JSON.stringify(data, null, 2))
    }
  )
})
