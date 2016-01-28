var gm = require('gm') //.subClass({imageMagick: true});
var http = require("http");
var fs = require("fs");
var path = require("path");

// -----------------------------------------------------------------
function log(info) {
	console.log('--------------------------');
	for(var i = 0; i < arguments.length; i++) {
		console.log(arguments[i]);
	}
}

// -----------------------------------------------------------------

function Poster(){

};

module.exports = Poster;
// -----------------------------------------------------------------

// 需要的参数： 
// 1. 原始图片
// 2. 用户图片
// 3. 用户名称
// 4. 用户关键字

Poster.prototype.fillWord = function(options, callback) {
	log("fillWord: Hi, I am called!");
	log(options)
	if(!options
		|| !options.hasOwnProperty("imagePath")
		|| !options.hasOwnProperty("word")
		|| !options.hasOwnProperty("username")) {
		log("fillWord: options illegal", options);
	} else {
		var _image = path.join(__dirname, '../img/target/', Math.random().toString(36).substr(2) + ".jpg");

		var imagePath = options.imagePath || "../img/canvas.jpg";
		var word = options.word || "幸福！";
		var username = options.username || "开业啦！";
		log("imagePath: " + imagePath, "username: " + username , "word: " + word)

		gm(imagePath)
		.stroke("#FFCD5C")
		.fill("#FFCD5C")
		.font("pingfangregular.ttf", 58)
		.drawText(240, 440, username)
		.font("pingfangregular.ttf", 180)
		.drawText(200,840, word)
		.write(_image, function (err) {
			log(arguments)
		  if(err) {
		  	log("fillWord: write file error", err);
		  	callback(err, null);
		  } else {
		  	log("fillWord: write file succeed");
		  	callback(err, _image);
		  }
		});
	}
}

// -----------------------------------------------------------------

Poster.prototype.handlePhoto = function(options, callback) {
	log("handlePhoto: Hi, I am called!");

	if(!options
		|| !options.hasOwnProperty("image")
		|| !options.hasOwnProperty("userimage")) {
		log("handlePhoto: options illegal", options);
		callback("handlePhoto: options illegal", null);
	} else {
		var image = options.image; // 背景图片
		var userimage = options.userimage; // 用户图像
		// 合成图片
		gm(userimage)
		.resize(255, 255)
		.compress("jpeg")
		.write(userimage, function(err) {
			if(err) {
				log("handlePhoto: resize user image error", err);
				callback("handlePhoto: resize user image error", null);
			} else {
				gm()
				.in('-page', '+0+0')  // Custom place for each of the images
				.in(image)
				.in('-page', '+256+100')
				.in(userimage)
				.quality(100)
				.minify()
				.mosaic()  // Merges the images as a matrix
				.write(image, function (err) {
				    if (err) {
				    	log("handlePhoto: handle photo error", err);
				    	callback(err);
				    } else {
				    	log("handlePhoto: handle photo succeed.");
				    	callback(null);
				    }
				});			
			}
		})
	}
}

// -----------------------------------------------------------------

Poster.prototype.getWxUserImg = function(options, callback) {
	log("getWxUserImg: Hi, I am called.");

	if(!options
		|| !options.hasOwnProperty("headimgurl")
		|| !options.hasOwnProperty("openid")) {
		log("getWxUserImg: options illegal", options);
		callback("getWxUserImg: options illegal", null);
	} else {
		var headimgurl = options.headimgurl;
		var openid = options.openid;
		var userimg = path.join(__dirname, '../img/target/', openid + '.jpg');


		// 下载图片
		http.get(headimgurl, function(res){
	    var imgData = "";

	    //一定要设置response的编码为binary否则会下载下来的图片打不开
	    res.setEncoding("binary"); 
	    
	    res.on("data", function(chunk){
        imgData+=chunk;
	    });

	    res.on("end", function(){
        fs.writeFile(userimg, imgData, "binary", function(err){
          if(err){
            log("getWxUserImg: write file error", err);
            callback(err, null);
          } else {
          	log("getWxUserImg: download file succeed");
          	var userOptions = {
          		userimg: userimg
          	}
          	callback(null, userOptions);
          }
        });
	    });
		});
	}
}

// -----------------------------------------------------------------


Poster.prototype.MergeImage = function(options, callback) {
	log("MergeImage: I am called.");
	if(!options
		|| !options.hasOwnProperty("openid") // wx user openid
		|| !options.hasOwnProperty("headimgurl") // wx user head image url
		|| !options.hasOwnProperty("username") // wx user name
		|| !options.hasOwnProperty("word") // word about user writes
		|| !options.hasOwnProperty("imagePath")) { //background image path
		log("MergeImage: options illegal", options);
		callback("MergeImage: options illegal", null);
	} else {
		var self = this;

		var word = options.word;
		var openid =options.openid;
		var username = options.username;
		var imagePath = options.imagePath;
		var headimgurl = options.headimgurl;

		var wxImgOptions = {
			openid: openid,
			headimgurl: headimgurl
		}

		// 获取用户图片等信息
		self.getWxUserImg(wxImgOptions, function(err, imgInfo) {
			if(err) {
				log("MergeImage: get user wximage headimg error", err);
				callback(err, null);
			} else {
				var userimg = imgInfo.userimg;

				var fillWordOptions = {
					imagePath: imagePath,
					word: word,
					username: username
				};
				// 图片水印
				self.fillWord(fillWordOptions, function(err, image) {
					if(err) {
						log("MergeImage: fillword error", err);
						callback(err, null);
					} else {
						handlePhotoOptions = {
							image: image,
							userimage:userimg 
						}
						// 合成用户图片和背景图片
						self.handlePhoto(handlePhotoOptions, function(err) {
							if(err) {
								log("MergeImage: handle photo error", err);
								callback(err, null);
							} else {
								log("MergeImage: handle photo succeed.");
								callback(null, {
									image: image
								})
							}
						})
					}
				})
			}
		}) 
	}
}

















// -----------------------------------------------------------------


