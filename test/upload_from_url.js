/*
This doesn't work any more. Because endpoint `/api/file-from-url` has been closed
*/

const client = require('./index')

client.on('started', () => {
  client.post_file_from_url(16130957314,'http://example.com/image.png', 'Hey, look at this cool icon!')
})
