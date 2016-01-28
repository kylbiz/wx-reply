var restify = require("restify");
var port = 4987;

var MessageServer = require('./lib/message');
var Message = new MessageServer();

var imagePath = './canvas.jpg';
var gm = require('gm'); 


function log(info) {
	console.log('--------------------------');
	for(var i = 0; i < arguments.length; i++) {
		console.log(arguments[i]);
	}
}

function fillWord(options, callback) {
	log("fillWord: Hi, I am called!");

	if(!options
		|| !options.hasOwnProperty("imagePath")
		|| !options.hasOwnProperty("word")
		|| !options.hasOwnProperty("username")) {
		log("fillWord: options illegal", options);
	} else {
		var _image = "./img/" + Math.random().toString(36).substr(2) + ".jpg";

		var imagePath = options.imagePath || "./canvas.jpg";
		var word = options.word || "幸福！";
		var username = options.username || "开业啦！";

		gm(imagePath)
		.stroke("#FFCD5C")
		.fill("#FFCD5C")
		.font("pingfangregular.ttf", 58)
		.drawText(240, 440, username)
		.font("pingfangregular.ttf", 180)
		.drawText(200,840, '节制')
		.write(_image, function (err) {
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

function handlePhoto(options, callback) {
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
		gm()
		.in('-page', '+0+0')  // Custom place for each of the images
		.in(image)
		.in('-page', '+256+100')
		.in(userimage)
		.quality(100)
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
}



// var wechat = require('wechat');
// var config = {
//   token: 'wechat',
//   appid: 'wx51bf6c24340021b0',
//   encodingAESKey: '0Isf7ge4uVVDxq7Ich0iRm4vGlZKkwNQR0JOMr3IFXF'
// };

//-------------------------------------------------
var server = restify.createServer();

//-------------------------------------------------

server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser());
server.use(restify.dateParser());
server.use(restify.queryParser());
server.use(restify.jsonp());
server.use(restify.gzipResponse());
server.use(restify.bodyParser());


//-------------------------------------------------
// server.post('/wechat', Message.getMessage);

server.post('/wechat', function(req, res, next) {
	next();

var options = {
	imagePath: imagePath,
	word: '节制',
	username: '刘遵坤'
};

fillWord(options, function(err, image) {
	if(err) {
		log(err);
	} else {
		var myoptions = {
			image: image,
			userimage: './example.png'
		}
		handlePhoto(myoptions, function(err) {
			log(arguments)
		})
	}
})



})



// server.post('/post', wechat(config, function (req, res, next) {
//   // 微信输入信息都在req.weixin上
//   var message = req.weixin;
//   console.log(message)
// }));




//-------------------------------------------------
server.listen(port, function() {
  console.log('listening: %s', server.url);
})

