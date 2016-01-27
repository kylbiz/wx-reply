var parseString = require('xml2js').parseString;
var data2xml = require('data2xml');
var convert  = data2xml();

var appid = 'wx51bf6c24340021b0';
var appsecret = 'd3ca2d71ddef3c3e1df7e14c12c52db5';
var WechatAPI = require('wechat-api');
var api = new WechatAPI(appid, appsecret);

var Poster = require('./poster')
var poster = new Poster(); // 图片处理函数

var path = require('path');
var type = 'image';


var filepath = path.join(__dirname, '../img/canvas.jpg');

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

//TODO
function HandleImage(options, callback) {
	var filepath = filepath;
	callback(null, filepath);
} 

// -----------------------------------------------------------------
/**
 * 微信订阅号根据提供关键字返回图片
 * @param  {httpRequest}   req  http request
 * @param  {httpResponse}   res  http response
 * @param  {Function} next transfer to next handler
 */
// 1. 用户提供文字，微信POST一份xml消息，解析xml 到 json 结构获取用户的openid 和 content,
// 2. 获取用户信息，根据用户信息生成图片，存于 public 路径下，并返回地址 filepath,
// 2. 根据filepath 上传图片到微信服务器，得到 media_id
// 4. 根据 media_id 生成xml 信息返回给用户，则用户得到一张图片

MessageServer.prototype.getMessage = function(req, res, next) {
	log("getMessage: this function called");
	next();
	var self = this;

	var body = req.body;  //用户消息
	parseString(body, function (err, result) {
    if(err) {
    	log("getMessage: parsing xml error", err);
    	// res.send({})
    } else {
    	log("getMessage: parsing xml succeed", result);
    	if(!result.hasOwnProperty('xml')) {
    		log("getMessage: parsing xml failed, not exists xml");
    	} else {
	    	var xml = result.xml;
	    	var ToUserName = xml.ToUserName[0];
	    	var FromUserName = xml.FromUserName[0];
	    	var Content = xml.Content[0];

	    	// 获取用户基本信息
	    	
	    	api.getUser({openid: FromUserName, lang: 'en'}, function(err, user) {
	    		if(err) {
	    			log("getMessage: get user information error", err);
	    		} else {
	    			log("getMessage: get user information succeed");
	    			if(!user || !user.hasOwnProperty("nickname")) {
	    				log("getMessage: get user information failed", user);
	    			} else {

	    				// var imgoptions = {
	    				// 	openid: FromUserName,
	    				// 	nickname: user.nickname,
	    				// 	headimgurl: user.headimgurl,
	    				// 	Content: Content
	    				// }

	    				var wxImgOptions = {
	    					openid: FromUserName,
	    					headimgurl: user.headimgurl
	    				}

	    				poster.getWxUserImg(wxImgOptions, function(err, imgInfo) {
	    					if(err) {
	    						log("getMessage: get user wximage headimg error", err);
	    					} else {
	    						var userimg = imgInfo.userimg;
	    						log("userimg: " + userimg);

	    						var fillWordOptions = {
	    							imagePath: filepath,
	    							word: Content,
	    							username: user.nickname
	    						};

	    						poster.fillWord(fillWordOptions, function(err, image) {
	    							if(err) {
	    								log("getMessage: fillword error", err);
	    							} else {
	    								log("image: " + image)
	    								handlePhotoOptions = {
	    									image: image,
	    									userimage:userimg 
	    								}
	    								log(handlePhotoOptions)

	    								poster.handlePhoto(handlePhotoOptions, function(err) {
	    									if(err) {
	    										log("getMessage: handle photo error", err);
	    									} else {
													api.uploadMedia(image, type, function(err, result) {
														if(err) {
															log("upload image error", err);
														} else {
															log("upload image succeed", result);
															var media_id = result.media_id;
															// 回复图片信息 xml 结构
												    	var replyXML = convert(
												    		'xml',
												    		{
												    			ToUserName: {
												    				_cdata: FromUserName,
												    			},
												    			FromUserName: {
												    				_cdata: ToUserName
												    			},
												    			CreateTime: Date.now(),
												    			MsgType: {
												    				_cdata: type
												    			},
												    			Image: {
												    				MediaId: {
												    					_cdata: media_id
												    				}
												    			}
												    		}
												  		);				

												    	log("replyXML: ", replyXML);
												  		res.send(replyXML);
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

// -----------------------------------------------------------------

