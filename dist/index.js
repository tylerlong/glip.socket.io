module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading wasm modules
/******/ 	var installedWasmModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// object with all compiled WebAssembly.Modules
/******/ 	__webpack_require__.w = {};
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/glip_socket.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/glip_socket.js":
/*!****************************!*\
  !*** ./src/glip_socket.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _ = __webpack_require__(/*! lodash */ "lodash");
var fastBindall = __webpack_require__(/*! fast_bindall */ "fast_bindall");
var idUtilities = __webpack_require__(/*! ./id_utilities */ "./src/id_utilities.js");
var typeIds = __webpack_require__(/*! ./type_ids */ "./src/type_ids.js");
var async = __webpack_require__(/*! async */ "async");
var socketClient = __webpack_require__(/*! socket.io-client */ "socket.io-client");
var eventEmitter = __webpack_require__(/*! events */ "events").EventEmitter;
var https = __webpack_require__(/*! https */ "https");

var GlipSocket = function GlipSocket(options) {
  _.extend(this, options);
  fastBindall(this);
  this.type_ids = typeIds;
  this.scoreboard_url = 'https://' + this.host + ':' + this.port;
  this.request_callbacks = {};
  this.request_count = 1;
  this.has_processed = {};
};

_.extend(GlipSocket.prototype, eventEmitter.prototype, idUtilities.prototype, {
  start: function start() {
    async.series([this.get_scoreboard, this.init_socket, this.signin, this.get_initial_data, this.init_socket, this.connect], this.finish);
  },
  finish: function finish(error) {
    if (error) {
      return this.handle_error(error);
    }
    // console.warn('UP AND RUNNING')
    this.emit('started');
  },
  connect: function connect(callback) {
    this.emit('connect');
    return process.nextTick(callback);
  },
  get_scoreboard: function get_scoreboard(callback) {
    var self = this;
    https.get(this.scoreboard_url, function (response) {
      var data = '';
      response.on('data', function (chunk) {
        data += chunk;
      });
      response.on('end', function () {
        var match = data.match(/"scoreboard":.*?"(.*?):/);
        var hostname = match[1];
        self.sexio_host = hostname;
        return process.nextTick(callback);
      });
    });
  },
  init_socket: function init_socket(callback) {
    var opts = {};
    if (this.cookie) {
      opts.extraHeaders = {
        Cookie: this.cookie
      };
    }
    // console.warn('cookie:', this.cookie)
    this.socket = socketClient.connect('https://' + this.sexio_host + ':' + this.port, opts);
    this.socket.once('connect', callback);
    this.socket.on('event', this.handle_event);
    this.socket.on('message', this.handle_message);
    this.socket.on('response', this.handle_response);
    this.socket.on('disconnect', this.handle_disconnect);
    this.socket.on('error', this.handle_error);
    this.socket.on('connect_error', this.handle_error);
    this.socket.on('connect_timeout', this.handle_error);
    this.socket.on('reconnect_error', this.handle_error);
    this.socket.on('reconnect_failed', this.handle_error);
  },
  handle_error: function handle_error(error) {
    if (error) {
      console.warn('ERROR:', error);
    }
  },
  signin: function signin(callback) {
    var self = this;
    this.request('/api/login', 'PUT', {
      email: this.user,
      password: this.password,
      rememberme: true,
      _csrf: null
    }, function (error, data) {
      if (error) {
        return callback(data);
      }
      self.auth = data['X-Authorization'];
      self.cookie = data.set_cookie.map(function (cookie) {
        var parts = cookie.split(/;/);
        return parts[0];
      }).join('; ');
      if (!self.cookie) {
        return callback(new Error('Unable to authenticate'));
      }
      return process.nextTick(callback);
    });
  },
  request: function request(uri, method, params, callback) {
    params.request_id = this.request_count;
    this.request_callbacks[this.request_count] = callback;
    this.request_count++;
    this.socket.emit('request', {
      uri: uri,
      parameters: params,
      method: method
    });
  },
  handle_response: function handle_response(data) {
    if (data && data.request && data.request.parameters && data.request.parameters.request_id) {
      var requestId = data.request.parameters.request_id;
      if (this.request_callbacks[requestId]) {
        return this.request_callbacks[requestId](null, data);
      }
    }
  },
  handle_event: function handle_event(event) {
    // console.warn("SOCKET EVENT:", event);
  },
  handle_message: function handle_message(messageRaw) {
    var message;
    try {
      message = JSON.parse(messageRaw);
    } catch (error) {
      console.warn(error);
    }
    if (!message.body || !message.body.objects) {
      return;
    }
    async.forEach(message.body.objects, this.process_object_group, this.handle_error);
  },
  process_object_group: function process_object_group(objectGroup, callback) {
    async.forEach(objectGroup, this.process_object, callback);
  },
  process_object: function process_object(object, callback) {
    var id = object._id;
    if (this.has_processed[id]) {
      return process.nextTick(callback);
    }
    this.has_processed[id] = true;
    var type = idUtilities.prototype.extract_type(id);
    this.emit('message', type, object);
    return process.nextTick(callback);
  },
  post: function post(groupId, text, itemIds, itemData) {
    itemIds = itemIds || [];
    var post = {
      created_at: +new Date(),
      creator_id: this.user_id,
      is_new: true,
      item_ids: itemIds,
      group_id: groupId,
      text: '' + text,
      item_data: itemData,
      at_mention_item_ids: [],
      at_mention_non_item_ids: [],
      from_group_id: groupId,
      post_ids: []
    };
    this.request('/api/post', 'POST', post, function (error, data) {
      if (error) {
        console.warn(error, data, post);
      }
    });
  },
  post_file_from_url: function post_file_from_url(groupId, url, text) {
    var self = this;
    this.file_from_url(url, function (error, data) {
      if (error) {
        return console.warn('ERROR POSTING FILE:', error);
      }
      self.file_from_stored_file(data.body, groupId, function (error, fileResponse) {
        if (error) {
          return console.warn(error);
        }
        var file = fileResponse.body;
        var itemData = { version_map: {} };
        itemData.version_map[file._id] = 1;
        self.post(groupId, text, [file._id], itemData);
      });
    });
  },
  file_from_stored_file: function file_from_stored_file(storedFile, groupId, callback) {
    var matches = storedFile.download_url.match(/.*\/(.*)$/);
    if (!matches) {
      return console.warn('NO MATCHES');
    }
    var name = matches[1].replace(/\?.*$/, '');
    var extMatches = name.match(/.*\.(.*)$/);
    var ext = extMatches ? extMatches[1] : 'unknown';
    this.request('/api/file', 'POST', {
      creator_id: this.user.id,
      group_ids: [groupId],
      is_new: true,
      name: name,
      no_post: true,
      source: 'web',
      type: ext,
      versions: [{
        download_url: storedFile.download_url,
        size: storedFile.size,
        stored_file_id: storedFile._id,
        url: storedFile.storage_url
      }]
    }, callback);
  },
  file_from_url: function file_from_url(url, callback) {
    this.request('/api/file-from-url', 'POST', {
      url: url,
      for_file_type: true
    }, callback);
  },
  handle_disconnect: function handle_disconnect(reason) {
    if (!reason.match(/io client disconnect/)) {
      console.warn('DISCONNECTED:', reason);
    }
  },
  get_initial_data: function get_initial_data(callback) {
    var self = this;
    this.request('/api/index', 'GET', {}, function (error, pack) {
      if (error) {
        console.log(error);
      }
      var data = pack.body;
      self.user_id = data.user_id;
      var parts = data.scoreboard.split(/:/);
      self.sexio_host = parts[0];
      self.port = parts[1];
      self.initial_data = data;
      self.socket.close();
      self.emit('initial_data', self.initial_data);
      return process.nextTick(callback);
    });
  }
});

module.exports = GlipSocket;

/***/ }),

/***/ "./src/id_utilities.js":
/*!*****************************!*\
  !*** ./src/id_utilities.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Provides utilities for handling IDs
var idUtilities = function idUtilities() {};

// Define mask for accessing the object type field
idUtilities.prototype.TYPE_MASK = 0x1fff;

//
// Public
//
// ID_Utilities.extract_type();
//
// purpose: Extract the type from a given ID
// arguments:
//    id: id from which to extract type
// returns: the type as an integer
//
idUtilities.prototype.extract_type = function (id) {
  return id & this.TYPE_MASK;
};

//
// Public
//
// ID_Utilities.extract_pure_id();
//
// purpose: Extract the pure ID (without type) from a given ID
// arguments:
//    id: id from which to extract pure id
// WARNING: THIS IS A BIT CPU INTENSIVE!!!
// returns: the pure ID
//
idUtilities.prototype.extract_pure_id = function (id) {
  return Math.floor(id / (this.TYPE_MASK + 1));
};

module.exports = idUtilities;

/***/ }),

/***/ "./src/type_ids.js":
/*!*************************!*\
  !*** ./src/type_ids.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Provides a table for managing type IDs

// NEVER EVER CHANGE THESE VALUES
// NEVER EVER CHANGE THESE VALUES
// NEVER EVER CHANGE THESE VALUES
// NEVER EVER CHANGE THESE VALUES
// NEVER EVER CHANGE THESE VALUES
var typerIds = {
  TYPE_ID_COMPANY: 1,
  TYPE_ID_GROUP: 2,
  TYPE_ID_PERSON: 3,
  TYPE_ID_POST: 4,
  TYPE_ID_PROJECT: 5,
  TYPE_ID_TEAM: 6,
  TYPE_ID_STATE: 7,
  TYPE_ID_PLUGIN: 8,
  TYPE_ID_TASK: 9,
  TYPE_ID_FILE: 10,
  TYPE_ID_PRESENCE: 11,
  TYPE_ID_STORED_FILE: 12,
  TYPE_ID_BUG: 13,
  TYPE_ID_EVENT: 14,
  TYPE_ID_PROFILE: 15,
  TYPE_ID_EMAIL_STATE: 16,
  TYPE_ID_LINK: 17,
  TYPE_ID_PAGE: 18,
  TYPE_ID_ACCOUNT: 19,
  TYPE_ID_MEETING: 20,
  TYPE_ID_MEGA_MEETING: 21,
  TYPE_ID_ADDLIVE_MEETING: 23,
  TYPE_ID_PAYMENT: 24,
  TYPE_ID_DO_IMPORT: 25,
  TYPE_ID_GMAIL_IMPORT: 26,
  TYPE_ID_INTEGRATION: 27,
  TYPE_ID_INTEGRATION_ITEM: 28,
  TYPE_ID_REFERRAL: 29,
  TYPE_ID_POLL: 30,
  TYPE_ID_CODE: 31,
  TYPE_ID_GOOGLE_SIGNON: 32,
  TYPE_ID_LINKEDIN_SIGNON: 33,
  TYPE_ID_QUESTION: 34,
  TYPE_ID_IMPORT_ITEM: 35,
  TYPE_ID_SLACK_IMPORT: 36,
  TYPE_ID_HIPCHAT_IMPORT: 37,
  TYPE_ID_ASANA_IMPORT: 38,
  TYPE_ID_TRELLO_IMPORT: 39,
  TYPE_ID_RC_SIGNON: 40,
  TYPE_ID_CONFERENCE: 41,
  TYPE_ID_CALL: 42,
  TYPE_ID_SIP: 43,
  TYPE_ID_EXPORT: 44,
  TYPE_ID_OUTLOOK_IMPORT: 60,
  TYPE_ID_RC_PHONE: 100,
  TYPE_ID_RC_CALL: 101,
  TYPE_ID_RC_VOICEMAIL: 102,
  TYPE_ID_RC_FAX: 103,
  TYPE_ID_RC_PRESENCE: 104,
  TYPE_ID_RC_BLOCK: 105,
  TYPE_ID_CUSTOM_ITEM: 7000,
  TYPE_ID_JIRA_ITEM: 7001,
  TYPE_ID_GITHUB_ITEM: 7002,
  TYPE_ID_HARVEST_ITEM: 7003,
  TYPE_ID_STRIPE_ITEM: 7004,
  TYPE_ID_ZENDESK_ITEM: 7005,
  TYPE_ID_ASANA_ITEM: 7006,
  TYPE_ID_BITBUCKET_ITEM: 7007,
  TYPE_ID_BOX_ITEM: 7008,
  TYPE_ID_BUGSNAG_ITEM: 7009,
  TYPE_ID_BUILDBOX_ITEM: 7010,
  TYPE_ID_CIRCLECI_ITEM: 7011,
  TYPE_ID_CLOUD66_ITEM: 7012,
  TYPE_ID_CODESHIP_ITEM: 7013,
  TYPE_ID_CONCUR_ITEM: 7014,
  TYPE_ID_CRASHLYTICS_ITEM: 7015,
  TYPE_ID_DATADOG_ITEM: 7016,
  TYPE_ID_EXPENSIFY_ITEM: 7017,
  TYPE_ID_FRESHBOOKS_ITEM: 7018,
  TYPE_ID_GETSATISFACTION_ITEM: 7019,
  TYPE_ID_GOSQUARED_ITEM: 7020,
  TYPE_ID_HANGOUTS_ITEM: 7021,
  TYPE_ID_HONEYBADGER_ITEM: 7022,
  TYPE_ID_HUBOT_ITEM: 7023,
  TYPE_ID_HUBSPOT_ITEM: 7024,
  TYPE_ID_INSIGHTLY_ITEM: 7025,
  TYPE_ID_JENKINS_ITEM: 7026,
  TYPE_ID_LIBRATO_ITEM: 7027,
  TYPE_ID_MAGNUM_ITEM: 7028,
  TYPE_ID_MAILCHIMP_ITEM: 7029,
  TYPE_ID_MARKETO_ITEM: 7030,
  TYPE_ID_NAGIOS_ITEM: 7031,
  TYPE_ID_NEWRELIC_ITEM: 7032,
  TYPE_ID_NINEFOLD_ITEM: 7033,
  TYPE_ID_ONEDRIVE_ITEM: 7034,
  TYPE_ID_OPSGENIE_ITEM: 7035,
  TYPE_ID_PAGERDUTY_ITEM: 7036,
  TYPE_ID_PAPERTRAIL_ITEM: 7037,
  TYPE_ID_PHABRICATOR_ITEM: 7038,
  TYPE_ID_PINGDOM_ITEM: 7039,
  TYPE_ID_PIVOTALTRACKER_ITEM: 7040,
  TYPE_ID_QUICKBOOKS_ITEM: 7041,
  TYPE_ID_RAYGUN_ITEM: 7042,
  TYPE_ID_REAMAZE_ITEM: 7043,
  TYPE_ID_ROLLCALL_ITEM: 7044,
  TYPE_ID_RSS_ITEM: 7045,
  TYPE_ID_SALESFORCE_ITEM: 7046,
  TYPE_ID_SCREENHERO_ITEM: 7047,
  TYPE_ID_SEMAPHORE_ITEM: 7048,
  TYPE_ID_SENTRY_ITEM: 7049,
  TYPE_ID_STATUSPAGEIO_ITEM: 7050,
  TYPE_ID_SUBVERSION_ITEM: 7051,
  TYPE_ID_SUPPORTFU_ITEM: 7052,
  TYPE_ID_TRAVIS_ITEM: 7053,
  TYPE_ID_TRELLO_ITEM: 7054,
  TYPE_ID_TWITTER_ITEM: 7055,
  TYPE_ID_USERVOICE_ITEM: 7056,
  TYPE_ID_VOCUS_ITEM: 7057,
  TYPE_ID_ZAPIER_ITEM: 7058,
  TYPE_ID_ZOHO_ITEM: 7059,
  TYPE_ID_DONEDONE_ITEM: 7060,
  TYPE_ID_AIRBRAKE_ITEM: 7061
  // END OF NEVER EVER CHANGE THESE VALUES

};module.exports = typerIds;

/***/ }),

/***/ "async":
/*!************************!*\
  !*** external "async" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("async");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),

/***/ "fast_bindall":
/*!*******************************!*\
  !*** external "fast_bindall" ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fast_bindall");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("https");

/***/ }),

/***/ "lodash":
/*!*************************!*\
  !*** external "lodash" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("lodash");

/***/ }),

/***/ "socket.io-client":
/*!***********************************!*\
  !*** external "socket.io-client" ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("socket.io-client");

/***/ })

/******/ });
//# sourceMappingURL=index.js.map