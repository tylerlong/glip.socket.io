const client = require('./index')

client.on('started', () => {
  // client.post(16130957314, 'fdsafds', [162812346378])

  // client.post(76161679362, 'before')
  // client.post(76161679362, 'Hey, look at this cool icon!', [162826846218])
  // client.post(76161679362, 'Hey, look at this cool icon!', [162812346378])
  // client.post(76161679362, 'after')

  // client.request(
  //   '/api/post',
  //   'POST',
  //   {
  //     group_id: 16130957314,
  //     text: `hello`,
  //     item_ids: [162812346378],
  //     from_group_id: 16130957314
  //   },
  //   (error, data) => {
  //     console.warn(error, data)
  //     console.log(JSON.stringify(data, null, 2))
  //   }
  // )  // client.request(
  //   '/api/post',
  //   'POST',
  //   {
  //     group_id: 16130957314,
  //     text: `hello`,
  //     item_ids: [162812346378],
  //     from_group_id: 16130957314
  //   },
  //   (error, data) => {
  //     console.warn(error, data)
  //     console.log(JSON.stringify(data, null, 2))
  //   }
  // )  // client.request(
  //   '/api/post',
  //   'POST',
  //   {
  //     group_id: 16130957314,
  //     text: `hello`,
  //     item_ids: [162812346378],
  //     from_group_id: 16130957314
  //   },
  //   (error, data) => {
  //     console.warn(error, data)
  //     console.log(JSON.stringify(data, null, 2))
  //   }
  // )

  client.request(
    '/api/post',
    'POST',
    {
      group_id: 94308556802,
      text: `hello`,
      item_ids: [162832916490],
      from_group_id: 76161679362 // important!
    },
    (error, data) => {
      console.warn(error, data)
      console.log(JSON.stringify(data, null, 2))
    }
  )
})
