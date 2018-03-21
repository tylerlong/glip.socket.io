const client = require('./index')

client.on('started', () => {
  client.request(
    '/api/task/53545148425',
    'PUT',
    {
      complete_boolean: 1
    },
    (error, data) => {
      console.warn(error, data)
      console.log(JSON.stringify(data, null, 2))
    }
  )
})
