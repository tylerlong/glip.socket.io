var _ = require('underscore')
var fastBindall = require('fast_bindall')
var idUtilities = require('./id_utilities')
var typeIds = require('./type_ids')
var async = require('async')
var socketClient = require('socket.io-client')
var eventEmitter = require('events').EventEmitter
var https = require('https')

var Bot = function (options) {
  _.extend(this, options)
  fastBindall(this)
  this.handlers = []
  this.type_ids = typeIds
  this.scoreboard_url = 'https://' + this.host + ':' + this.port
  this.request_callbacks = {}
  this.request_count = 1
  this.has_processed = {}
}

_.extend(Bot.prototype, eventEmitter.prototype, idUtilities.prototype, {
  start: function () {
    async.series([
      this.get_scoreboard,
      this.init_socket,
      this.signin,
      this.get_initial_data,
      this.init_socket,
      this.connect
    ], this.finish)
  },
  finish: function (error) {
    if (error) {
      return this.handle_error(error)
    }
    console.warn('UP AND RUNNING')
    this.emit('started')
  },
  connect: function (callback) {
    this.emit('connect')
    return process.nextTick(callback)
  },
  get_scoreboard: function (callback) {
    var self = this
    https.get(this.scoreboard_url, function (response) {
      var data = ''
      response.on('data', function (chunk) {
        data += chunk
      })
      response.on('end', function () {
        var match = data.match(/"scoreboard":.*?"(.*?):/)
        var hostname = match[1]
        self.sexio_host = hostname
        return process.nextTick(callback)
      })
    })
  },
  init_socket: function (callback) {
    var opts = {}
    if (this.cookie) {
      opts.extraHeaders = {
        Cookie: this.cookie
      }
    }
    console.warn('cookie:', this.cookie)
    this.socket = socketClient.connect('https://' + this.sexio_host + ':' + this.port, opts)
    this.socket.once('connect', callback)
    this.socket.on('event', this.handle_event)
    this.socket.on('message', this.handle_message)
    this.socket.on('response', this.handle_response)
    this.socket.on('disconnect', this.handle_disconnect)
    this.socket.on('error', this.handle_error)
    this.socket.on('connect_error', this.handle_error)
    this.socket.on('connect_timeout', this.handle_error)
    this.socket.on('reconnect_error', this.handle_error)
    this.socket.on('reconnect_failed', this.handle_error)
  },
  handle_error: function (error) {
    if (error) {
      console.warn('ERROR:', error)
    }
  },
  signin: function (callback) {
    var self = this
    this.request(
      '/api/login',
      'PUT',
      {
        email: this.user,
        password: this.password,
        rememberme: true,
        _csrf: null
      },
      function (error, data) {
        if (error) { return callback(data) }
        self.auth = data['X-Authorization']
        self.cookie = data.set_cookie.map(function (cookie) {
          var parts = cookie.split(/;/)
          return parts[0]
        }).join('; ')
        if (!self.cookie) { return callback('Unable to authenticate') }
        return process.nextTick(callback)
      }
    )
  },
  request: function (uri, method, params, callback) {
    params.request_id = this.request_count
    this.request_callbacks[this.request_count] = callback
    this.request_count++
    this.socket.emit(
      'request',
      {
        uri: uri,
        parameters: params,
        method: method
      }
    )
  },
  handle_response: function (data) {
    if (
      data &&
      data.request &&
      data.request.parameters &&
      data.request.parameters.request_id
    ) {
      var requestId = data.request.parameters.request_id
      if (this.request_callbacks[requestId]) {
        return this.request_callbacks[requestId](null, data)
      }
    }
  },
  handle_event: function (event) {
    // console.warn("SOCKET EVENT:", event);
  },
  handle_message: function (messageRaw) {
    var message
    try {
      message = JSON.parse(messageRaw)
    } catch (error) {
      console.warn(error)
    }
    if (!message.body || !message.body.objects) { return }
    async.forEach(message.body.objects, this.process_object_group, this.handle_error)
  },
  process_object_group: function (objectGroup, callback) {
    async.forEach(objectGroup, this.process_object, callback)
  },
  process_object: function (object, callback) {
    var id = object._id
    if (this.has_processed[id]) { return process.nextTick(callback) }
    this.has_processed[id] = true
    var type = idUtilities.prototype.extract_type(id)
    this.emit('message', type, object)
    return process.nextTick(callback)
  },
  post: function (groupId, text, itemIds, itemData) {
    itemIds = itemIds || []
    var post = {
      created_at: +new Date(),
      creator_id: this.user_id,
      is_new: true,
      item_ids: itemIds,
      group_id: groupId,
      text: text,
      item_data: itemData,
      at_mention_item_ids: [],
      at_mention_non_item_ids: [],
      from_group_id: groupId,
      post_ids: []
    }
    this.request(
      '/api/post',
      'POST',
      post,
      function (error, data) {
        if (error) {
          console.warn(error, data, post)
        }
      }
    )
  },
  post_file_from_url: function (groupId, url, text) {
    var self = this
    this.file_from_url(url, function (error, data) {
      if (error) { return console.warn('ERROR POSTING FILE:', error) }
      self.file_from_stored_file(data.body, groupId, function (error, fileResponse) {
        if (error) { return console.warn(error) }
        var file = fileResponse.body
        var itemData = { version_map: {} }
        itemData.version_map[file._id] = 1
        self.post(groupId, text, [file._id], itemData)
      })
    })
  },
  file_from_stored_file: function (storedFile, groupId, callback) {
    var matches = storedFile.download_url.match(/.*\/(.*)$/)
    if (!matches) { return console.warn('NO MATCHES') }
    var name = matches[1].replace(/\?.*$/, '')
    var extMatches = name.match(/.*\.(.*)$/)
    var ext = extMatches ? extMatches[1] : 'unknown'
    this.request(
      '/api/file',
      'POST',
      {
        creator_id: this.user.id,
        group_ids: [groupId],
        is_new: true,
        name: name,
        no_post: true,
        source: 'web',
        type: ext,
        versions: [
          {
            download_url: storedFile.download_url,
            size: storedFile.size,
            stored_file_id: storedFile._id,
            url: storedFile.storage_url
          }
        ]
      },
      callback
    )
  },
  file_from_url: function (url, callback) {
    this.request(
      '/api/file-from-url',
      'POST',
      {
        url: url,
        for_file_type: true
      },
      callback
    )
  },
  handle_disconnect: function (reason) {
    if (!reason.match(/io client disconnect/)) {
      console.warn('DISCONNECTED:', reason)
    }
  },
  get_initial_data: function (callback) {
    var self = this
    this.request(
      '/api/index',
      'GET',
      {},
      function (error, pack) {
        if (error) {
          console.log(error)
        }
        var data = pack.body
        self.user_id = data.user_id
        var parts = data.scoreboard.split(/:/)
        self.sexio_host = parts[0]
        self.port = parts[1]
        self.initial_data = data
        self.socket.close()
        self.emit('initial_data', self.initial_data)
        return process.nextTick(callback)
      }
    )
  },
  use: function (HandlerDef, opts) {
    opts = opts || {}
    opts.bot = this
    this.handlers.push(new HandlerDef(opts))
  }
})

module.exports = Bot
