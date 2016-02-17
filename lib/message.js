
var parseString = require('xml2js').parseString;
var data2xml = require('data2xml');
var convert  = data2xml();

var redis = require("redis");
var redisClient = redis.createClient();

var config = require('../config.js');
var wxconfig = config.wx;  // 微信配置

var appid = wxconfig.appid; // 微信 apid
var appsecret = wxconfig.appsecret; // 微信 appsecret
var errorMessage = wxconfig.errorMessage; // 微信出错回复


var WechatAPI = require('wechat-api');
var api = new WechatAPI(appid, appsecret, function(callback) {
  redisClient.hgetall("token", function(err, token) {
  	if(err) {
  		log("api: get token from redis error", err);
  		callback(err, null);
  	} else {
  		log("api: get token from redis succeed");
  		callback(null, token);
  	}
  })
}, function(token, callback) {
	var accessToken = token.accessToken;
	var expireTime = token.expireTime;
	var tokenArray = [
		"token",
		"accessToken",
		accessToken,
		"expireTime",
		expireTime
	];
	log(tokenArray)
	redisClient.hmset(tokenArray, callback);
});


var Poster = require('./poster')
var poster = new Poster(); // 图片处理函数

var path = require('path');
var type = 'image';

var WX = require("./wx.js");
var wx = new WX();

// -----------------------------------------------------------------
function log(info) {
  console.log("-----------------------------------");
  var length = arguments.length;
  for (var i = 0; i < length; i++) {
    console.log(arguments[i]);
  }
}

// -----------------------------------------------------------------

function MessageServer() {
};
module.exports = MessageServer;


// ----------------------------------------------------------------------------------

/**
 * 回复错误信息
 * @param  {Object} api    wechat-api 
 * @param  {string} openid wx user openid
 */
var _errorMessage = function(openid, errorMessage) {
	log("_errorMessage: Hi, I am called")
	api.sendText(openid, errorMessage, function(err, result) {
		if(err) {
			log("_errorMessage: send error message error", err);
		} else {
			log("_errorMessage: send error message succeed");
		}
	});
}

// -----------------------------------------------------------------
/**
 * 微信订阅号根据提供关键字返回图片
 * @param  {httpRequest}   req  http request
 * @param  {httpResponse}   res  http response
 * @param  {Function} next transfer to next handler
 */
// 1. 用户提供文字，微信POST一份xml消息，解析xml 到 json 结构获取用户的openid 和 content,
// 2. 获取用户信息，根据用户信息生成图片，存于 img 路径下，并返回地址 filepath,
// 2. 根据filepath 上传图片到微信服务器，得到 media_id
// 4. 根据 media_id 生成xml 信息返回给用户，则用户得到一张图片
// 5. 删除用户图片

MessageServer.prototype.getMessage = function(req, res, next) {
	log("getMessage: this function called");
	var self = this;
	next();
	res.end(''); // 长时间不能回复处理

	var body = req.body;  //用户消息
	parseString(body, function (err, result) {
    if(err) {
    	log("getMessage: parsing xml error", err);
    } else {
    	log("getMessage: parsing xml succeed");

    	var xml = result.xml;
    	var ToUserName = xml.ToUserName[0];
    	var FromUserName = xml.FromUserName[0];
    	var MsgType = xml.MsgType[0];

    	var generate_flag = false; // 是否进行

    	if(MsgType === "event" && xml.Event[0] === "CLICK") {
    		generate_flag = true;
    	} else if(MsgType === "text" && (xml.Content[0] === "开业啦" || xml.Content[0] === "刘大哥")){
    		generate_flag = true;
    	}

    	var imgLists = [];

    	// 获取用户基本信息
    	
    	if(!generate_flag) {
    		// TODO: 回复错误信息
    		log("getMessage: not allowed generate image, generate_flag: " + generate_flag)
    		_errorMessage(FromUserName, errorMessage);

    	} else {
    		log("getMessage: start get user information")

	    	api.getUser({openid: FromUserName, lang: 'en'}, function(err, user) {
	    		if(err) {
	    			log("getMessage: get user information error", err);
	    			// TODO: 回复错误信息
	    			_errorMessage(FromUserName, errorMessage);

	    		} else {
	    			log("getMessage: get user information succeed");
	    			if(!user || !user.hasOwnProperty("nickname")) {
	    				log("getMessage: get user information failed", user);
	    				// TODO: 回复错误信息
	    				_errorMessage(FromUserName, errorMessage);


	    			} else {
	    			
	    				var wxImgOptions = {
	    					openid: FromUserName,
	    					headimgurl: user.headimgurl
	    				}

	    				// 下载用户图像
	    				poster.getWxUserImg(wxImgOptions, function(err, imgInfo) {
	    					if(err) {
	    						log("getMessage: get user wximage headimg error", err);
	    						// TODO: 回复错误信息
	    						
	    						_errorMessage(FromUserName, errorMessage);
	    					} else {
	    						var userimage = imgInfo.userimage;

	    						imgLists.push(imgInfo.userimage); // 存储用户图像

	    						// 随机选择背景图片
	    						var canvasNum = Math.floor(Math.random() * 10) + 1;
	    						var filepath = path.join(__dirname, '../img/', "canvas" + canvasNum + '.jpg');

	    						var fillWordOptions = {
	    							imagePath: filepath,
	    							username: user.nickname
	    						};

	    						// 背景图片填充文字
	    						poster.fillWord(fillWordOptions, function(err, image) {
	    							if(err) {
	    								log("getMessage: fillword error", err);
	    								// TODO: 回复错误信息
	    								_errorMessage(FromUserName, errorMessage);

	    							} else {
									
 											imgLists.push(image);

	    								handlePhotoOptions = {
	    									image: image,
	    									userimage:userimage 
	    								}

	    								// 合成图片
	    								poster.handlePhoto(handlePhotoOptions, function(err, temp_images) {
	    									imgLists = imgLists.concat(temp_images);
	    									
	    									if(err) {
	    										log("getMessage: handle photo error", err);
	    										_errorMessage(FromUserName, errorMessage);

	    									} else {
	    										// 上传图片到微信服务器
													api.uploadMedia(image, type, function(err, result) {
														if(err) {
															log("getMessage: upload image error", err);
															_errorMessage(FromUserName, errorMessage);

														} else {
															log("getMessage: upload image succeed");
															var media_id = result.media_id;
															// 回复图片信息 xml 结构
															log("getMessage: 回复图片信息");

															api.sendImage(FromUserName, media_id, function(err, result, res) {
																log("getMessage: 回复图片信息结果")
																if(err) {
																	log("getMessage: 图片回复错误");
																	_errorMessage(FromUserName, errorMessage);
																} 
															});

												  		// 移除用户图片信息
												  		poster.RemoveUserImg({imgLists: imgLists}, function(err) {
												  			if(err) {
												  				log("getMessage: remove user image error", err);
												  			} else {
												  				log("getMessage: remove user image succeed");
												  			}
												  		})

														}
													});	
	    									}
	    								})
	    							}
	    						})
	    					}
	    				}) 
	    			}
	    		}
	    	});
    	}
    }
  });
};	


