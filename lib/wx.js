var restify = require('restify');

var redis = require("redis");
var redisClient = redis.createClient();

var wxconfig = require('../config.js').wx;
var appid = wxconfig.appid; // 微信 apid
var appsecret = wxconfig.appsecret; // 微信 appsecret

var wxBaseHost = 'https://api.weixin.qq.com';
// var tokenURI = wxBaseHost + '/cgi-bin/token';
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
	var tokenURI = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + appsecret; 
	log(tokenURI)
	client.get(tokenURI, function(err, req, res, obj) {
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
WX.prototype.handleUser = function(options, callback) {
	log("handleUser: Hi I am called.");

	if(!options
		|| !options.hasOwnProperty("openid")) {
		log("handleUser: options illegal", err);
		callback(err, null);
	} else {
		redisClient.hmget("token", "access_token", function(err, access_token) {
			if(err) {
				log("handleUser: get access_token from redis error", err);
				// self.maintainToken();
			} else {
				log("handleUser: get access_token succeed");
				var userOptions = {
					access_token: access_token,
					openid: openid
				}
				self.getUserInfo(userOptions, function(err, user) {
					if(err) {
						log("handleUser: get user information error", err);
						call(err, null);
					} else {
						log("handleUser: get user succeed.");
						callback(null, user);
					}
				})
			}
		})		
	}
}


// -----------------------------------------------------------------

WX.prototype.saveToken = function(options, callback) {
	var self = this;
	log("saveToken: Hi I am called.");
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
	update_time
  ];
  log(tokenArray)
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

// -----------------------------------------------------------------

WX.prototype.maintainToken = function() {
	log("maintainToken: I am called.");

	var self = this;

	redisClient.hgetall("token", function(err, token) {
		if(err) {
			log("maintainToken: no token exists , get new token");
			setTimeout(function() {
				self.getAccessToken(function(err, tokenObj) {
					if(err) {
						log("maintainToken: get access_token error", err);
						// 失败 5秒后继续维护token
						setTimeout(function() {
							self.maintainToken();
						}, 5000);
					} else {
						self.saveToken(tokenObj, function(err) {
							if(err) {
								log("maintainToken: save token obj error", err);
								setTimeout(function() {
									self.saveToken(tokenObj, function(err) {
										if(err) {
											setTimeout(function() {
												self.maintainToken();
											}, 5000);
										} else {
											// 完成存储后在时间节点到达后继续维护token
											setTimeout(function() {
												self.maintainToken();
											}, (tokenObj.expires_in - 60 * 10) * 1000)											
										}
									});
								}, 5000);

							} else {
								log("maintainToken: save token obj succeed");
								// 完成存储后在时间节点到达后继续维护token
								setTimeout(function() {
									self.maintainToken();
								}, (tokenObj.expires_in - 60 * 10) * 1000)

							}
						})
					}
				});
			}, 5000);
		} else {
			log(token)
			var expires_in = 7200;
			if(token && token.hasOwnProperty("expires_in")) {
				expires_in = token.expires_in;
			}
			var update_time = new Date('1995-12-17T03:24:00');
			if(token && token.hasOwnProperty("update_time")) {
				update_time = token.update_time;
			}

			log(expires_in, update_time)
			var tokenLega = timeLegal(update_time, expires_in);
			if(typeof(update_time) === "string") {
				update_time = new Date(update_time);
			}

			if(tokenLega) {
				log("maintainToken: wait to get new token");
				var startTokenTime = parseInt(update_time.getTime())  + (expires_in - 10 * 60) * 1000 - (new Date()).getTime();

				setTimeout(function() {
					self.getAccessToken(function(err, tokenObj) {
						if(err) {
							log("maintainToken: maintaince new access_token error", err);
							// 重新执行维护程序
							setTimeout(function() {
								self.maintainToken();
							}, 5000);
						} else {
							self.saveToken(tokenObj, function(err) {
								if(err) {
									setTimeout(function() {
										self.maintainToken();
									}, 5000);
								} else {
									// 完成存储后在时间节点到达后继续维护token
									setTimeout(function() {
										self.maintainToken();
									}, (tokenObj.expires_in - 60 * 10) * 1000)											
								}
							});
						}
					});			
				}, startTokenTime);
			} else {
			log("maintainToken: start get new token");
				setTimeout(function() {
					self.getAccessToken(function(err, tokenObj) {
						if(err) {
							log("maintainToken: get new access_token error", err);
							setTimeout(function() {
								self.maintainToken();
							}, 5000);
						} else {
							self.saveToken(tokenObj, function(err) {
								if(err) {
									setTimeout(function() {
										self.maintainToken();
									}, 5000);
								} else {
									// 完成存储后在时间节点到达后继续维护token
									setTimeout(function() {
										self.maintainToken();
									}, (tokenObj.expires_in - 60 * 10) * 1000)											
								}
							});
						}
					});			
				}, 5000);			
			}
		}
	})
}
// -----------------------------------------------------------------

function timeLegal(time, expires_in) {
	log(time, typeof(time), time instanceof Date)
	if(typeof(time) === "string") {
		time = new Date(time);
	} 
	var time1 = parseInt(time.getTime()) / 1000;
	var now = parseInt((new Date()).getTime()) / 1000;

	if(time1 + (expires_in - 10 * 60) > now) {
		return true;
	} else {
		return false;
	}
}

// -----------------------------------------------------------------


