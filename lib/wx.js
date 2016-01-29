var restify = require('restify');

var redis = require("redis");
var redisClient = redis.createClient();

var wxconfig = require('../config.js').wx;
var appid = wxconfig.appid; // 微信 apid
var appsecret = wxconfig.appsecret; // 微信 appsecret

var wxBaseHost = 'https://api.weixin.qq.com';
var tokenURI = wxBaseHost + '/cgi-bin/token';
var userURI = wxBaseHost + '/cgi-bin/user/info';

var tokenOptions = {
	grant_type: 'client_credential',
	appid: appid,
	secret: appsecret
};

// -----------------------------------------------------------------

var client = restify.createJsonClient({
  url: 'https://api.weixin.qq.com',
});


// -----------------------------------------------------------------

function log(info) {
  console.log("-----------------------------------");
  var length = arguments.length;
  for (var i = 0; i < length; i++) {
    console.log(arguments[i]);
  }
};


// -----------------------------------------------------------------

function WX() {
};
module.exports = WX;

// -----------------------------------------------------------------

WX.prototype.getAccessToken = function(callback) {
	log("getAccessToken: Hi , I am called.")
	client.get(wxBaseHost, tokenOptions, function(err, req, res, obj) {
		if(err) {
			log("getAccessToken: get access token error", err);
			callback("getAccessToken: get access token error", err);
		} else {
			var access_token = obj.access_token;
			var expires_in = obj.expires_in;
			callback(err, {access_token: access_token, expires_in: expires_in});
		}
	})
}

// -----------------------------------------------------------------

WX.prototype.getUserInfo = function(options, callback) {
	log("getUserInfo: Hi, I am called.")

	if(!options
		|| !options.hasOwnProperty("access_token")
		|| !options.hasOwnProperty("openid")) {
		log("getUserInfo: options illegal", options);
		callback("getUserInfo: options illegal", null);
	} else {
		var access_token = options.access_token;
		var openid = options.openid;
		var userOptions = {
			access_token: access_token,
			openid: openid
		}

		client.get(userURI, userOptions, function(err, req, res, obj) {
			if(err) {
				log("getUserInfo: get user info error", err);
				callback(err, null);
			} else {
				log("getUserInfo: get user info succeed.");

				callback(null, {user: obj});		
			}
		})		
	}
}

// -----------------------------------------------------------------

WX.prototype.saveToken = function(options, callback) {
	var self = this;

	self.getAccessToken(function(err, tokenObj) {
		if(err) {
			log("saveToken: token obj error", err);
			callback("saveToken: token obj error");
		} else {
			var access_token = options.access_token;
			var expires_in = options.expires_in;
			var update_time = new Date();
			var tokenArray = [
			"token", 
			"access_token", 
			access_token,
			'expires_in',
			expires_in,
			'update_time',
			'update_time'
		  ];
			redisClient.hmset(tokenArray, function(err) {
				if(err) {
					log("saveToken: save token error", tokenArray);
					callback(err);
				} else {
					log("saveToken: save token succeed");
					callback(null);
				}
			})
		}
	})
}

// -----------------------------------------------------------------

WX.prototype.maintainToken = function() {
	log("maintainToken: I am called.");

	var self = this;

	redisClient.hmget("token", function(err, token) {
		if(err) {
			log("maintainToken: no token exists , get new token");
			setTimeout(function() {
				self.getAccessToken(function(err, tokenObj) {
					if(err) {
						log("maintainToken: get access_token error", err);
					} else {
						self.saveToken(tokenObj, function(err) {
							if(err) {
								log("maintainToken: save token obj error", err);
								setTimeout(function() {
									self.saveToken(tokenObj);
								}, 5000);
							} else {
								log("maintainToken: save token obj succeed");
							}
						})
					}
				});
			}, 5000);
		} else {
			var expires_in = token.expires_in;
			var update_time = token.update_time;

			var tokenLega = timeLegal(update_time, expires_in);

			if(tokenLega) {
				log("maintainToken: wait to get new token");
				var startTokenTime = parseInt(update_time.getTime())  + (expires_in - 10 * 60) * 1000 - (new Date()).getTime();

				setTimeout(function() {
					self.getAccessToken(function(err, tokenObj) {
						if(err) {
							log("maintainToken: maintaince new access_token error", err);
						} else {
							self.saveToken(tokenObj, function(err) {
								if(err) {
									log("maintainToken: maintaince new token obj error", err);
									setTimeout(function() {
										self.saveToken(tokenObj);
									}, 5000);
								} else {
									log("maintainToken: maintaince token obj succeed");
								}
							})
						}
					});			
				}, startTokenTime);
			} else {
			log("maintainToken: start get new token");
				setTimeout(function() {
					self.getAccessToken(function(err, tokenObj) {
						if(err) {
							log("maintainToken: get new access_token error", err);
						} else {
							self.saveToken(tokenObj, function(err) {
								if(err) {
									log("maintainToken: save new token obj error", err);
									setTimeout(function() {
										self.saveToken(tokenObj);
									}, 5000);
								} else {
									log("maintainToken: save token obj succeed");
								}
							})
						}
					});			
				}, 5000);			
			}
		}
	})
}
// -----------------------------------------------------------------

function timeLegal(time, expires_in) {
	var temptime1 = parseInt(time1.getTime()) / 1000;
	var now = parseInt((new Date()).getTime()) / 1000;

	if(time1 + expires_in - 10 * 60 < now) {
		return true;
	} else {
		return false;
	}
}

// -----------------------------------------------------------------





