
// var parseString = require('xml2js').parseString;
// var data2xml = require('data2xml');
// var convert  = data2xml();

// var config = require('../config.js');
// var wxconfig = config.wx;  // 微信配置

// var appid = wxconfig.appid; // 微信 apid
// var appsecret = wxconfig.appsecret; // 微信 appsecret
// var errorMessage = wxconfig.errorMessage; // 微信出错回复

// var WechatAPI = require('wechat-api');
// var api = new WechatAPI(appid, appsecret);

// var Poster = require('./poster')
// var poster = new Poster(); // 图片处理函数

// var path = require('path');
// var type = 'image';

// var WX = require("./wx.js");
// var wx = new WX();


// // var filepath = path.join(__dirname, '../img/canvas.jpg');

// // -----------------------------------------------------------------
// function log(info) {
//   console.log("-----------------------------------");
//   var length = arguments.length;
//   for (var i = 0; i < length; i++) {
//     console.log(arguments[i]);
//   }
// }

// // -----------------------------------------------------------------

// function MessageServer() {
// };
// module.exports = MessageServer;


// // -----------------------------------------------------------------
// /**
//  * 微信订阅号根据提供关键字返回图片
//  * @param  {httpRequest}   req  http request
//  * @param  {httpResponse}   res  http response
//  * @param  {Function} next transfer to next handler
//  */
// // 1. 用户提供文字，微信POST一份xml消息，解析xml 到 json 结构获取用户的openid 和 content,
// // 2. 获取用户信息，根据用户信息生成图片，存于 img 路径下，并返回地址 filepath,
// // 2. 根据filepath 上传图片到微信服务器，得到 media_id
// // 4. 根据 media_id 生成xml 信息返回给用户，则用户得到一张图片
// // 5. 删除用户图片

// MessageServer.prototype.getMessage = function(req, res, next) {
// 	log("getMessage: this function called");
// 	next();
// 	setTimeout(function() {
// 		res.send("");
// 	}, 4500);

// 	var self = this;
// 	var body = req.body;  //用户消息
// 	parseString(body, function (err, result) {
//     if(err) {
//     	log("getMessage: parsing xml error", err);
//     	res.send("")
//     } else {
//     	log("getMessage: parsing xml succeed", result);

//     	var xml = result.xml;
//     	var ToUserName = xml.ToUserName[0];
//     	var FromUserName = xml.FromUserName[0];
//     	var MsgType = xml.MsgType[0];

//     	var generate_flag = false; // 是否进行

//     	if(MsgType === "event" && xml.Event[0] === "CLICK") {
//     		generate_flag = true;
//     	} else if(MsgType === "text" && (xml.Content[0] === "开业啦" || xml.Content[0] === "刘大哥")){
//     		generate_flag = true;
//     	}

//     	var imgLists = [];

//     	// 生成用户提示等待消息
//     	var errorXml = convert(
//     		'xml',
//     		{
//     			ToUserName: {
//     				_cdata: FromUserName,
//     			},
//     			FromUserName: {
//     				_cdata: ToUserName
//     			},
//     			CreateTime: Date.now(),
//     			MsgType: {
//     				_cdata: 'text'
//     			},
//     			Content: {
//     				_cdata: errorMessage
//     			}
//     		}
//   		);	
//     	// 获取用户基本信息
    	
//     	if(!generate_flag) {
//     		res.send(errorXml);
//     	} else {
//     		log("start get user information")
// 	    	// api.getUser({openid: FromUserName, lang: 'en'}, function(err, user) {
// 	    	wx.handleUser({openid: FromUserName}, function(err, userObj) {
// 	    		if(err) {
// 	    			log("getMessage: get user information error", err);
// 	    			res.send(errorXml);
// 	    		} else {
// 	    			log("getMessage: get user information succeed");
// 	    			if(!userObj || !userObj.hasOwnProperty("user") || userObj.user.hasOwnProperty("nickname")) {
// 	    				log("getMessage: get user information failed", userObj);
// 	    				res.send(errorXml);
// 	    			} else {
// 	    				var user = userObj.user;

// 	    				var wxImgOptions = {
// 	    					openid: FromUserName,
// 	    					headimgurl: user.headimgurl
// 	    				}

// 	    				// 下载用户图像
// 	    				poster.getWxUserImg(wxImgOptions, function(err, imgInfo) {
// 	    					if(err) {
// 	    						log("getMessage: get user wximage headimg error", err);
// 	    						res.send(errorXml);
// 	    					} else {
// 	    						var userimg = imgInfo.userimg;
// 	    						log("userimg: " + userimg);

// 	    						imgLists.push(imgInfo.userimg); // 存储用户图像

// 	    						// 随机选择背景图片
// 	    						var canvasNum = Math.floor(Math.random() * 10) + 1;
// 	    						var filepath = path.join(__dirname, '../img/', "canvas" + canvasNum + '.jpg');

// 	    						var fillWordOptions = {
// 	    							imagePath: filepath,
// 	    							username: user.nickname
// 	    						};

// 	    						// 背景图片填充文字
// 	    						poster.fillWord(fillWordOptions, function(err, image) {
// 	    							if(err) {
// 	    								log("getMessage: fillword error", err);
// 	    								res.send(errorXml);
// 	    							} else {
// 	    								log("image: " + image)
 									
//  											imgLists.push(image);

// 	    								handlePhotoOptions = {
// 	    									image: image,
// 	    									userimage:userimg 
// 	    								}

// 	    								// 合成图片
// 	    								poster.handlePhoto(handlePhotoOptions, function(err) {
// 	    									if(err) {
// 	    										log("getMessage: handle photo error", err);
// 	    										res.send(errorXml);
// 	    									} else {
// 	    										// 上传图片到微信服务器
// 													api.uploadMedia(image, type, function(err, result) {
// 														if(err) {
// 															log("upload image error", err);
// 															res.send(errorXml);
// 														} else {
// 															log("upload image succeed", result);
// 															var media_id = result.media_id;
// 															// 回复图片信息 xml 结构
// 												    	var replyXML = convert(
// 												    		'xml',
// 												    		{
// 												    			ToUserName: {
// 												    				_cdata: FromUserName,
// 												    			},
// 												    			FromUserName: {
// 												    				_cdata: ToUserName
// 												    			},
// 												    			CreateTime: Date.now(),
// 												    			MsgType: {
// 												    				_cdata: type
// 												    			},
// 												    			Image: {
// 												    				MediaId: {
// 												    					_cdata: media_id
// 												    				}
// 												    			}
// 												    		}
// 												  		);				
// 												    	// 返回用户图片信息
// 												    	log("replyXML: ", replyXML);
// 												  		res.send(replyXML);

// 												  		// 移除用户图片信息
// 												  		poster.RemoveUserImg({imgLists: imgLists}, function(err) {
// 												  			if(err) {
// 												  				log("getMessage: remove user image error", err);
// 												  			} else {
// 												  				log("getMessage: remove user image succeed");
// 												  			}
// 												  		})

// 														}
// 													});	
// 	    									}
// 	    								})
// 	    							}
// 	    						})
// 	    					}
// 	    				}) 
// 	    			}
// 	    		}
// 	    	});
//     	}

//     }
//   });
// };	