/*
This doesn't work any more. Because endpoint `/api/file-from-url` has been closed
*/

const client = require('./index')

client.on('started', () => {
  client.post_file_from_url(16130957314,'https://glip-vault-1.s3.amazonaws.com/web/customer_files/530850668556/modified.png?Expires=2075494478&AWSAccessKeyId=AKIAJROPQDFTIHBTLJJQ&Signature=AeykXwQ63Tz3SkuJS7Dn9hsbf7Q%3D', 'Hey, look at this cool icon!')
})
