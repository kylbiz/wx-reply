var appid = 'wx51bf6c24340021b0';
var appsecret = 'd3ca2d71ddef3c3e1df7e14c12c52db5';
var WechatAPI = require('wechat-api');
var api = new WechatAPI(appid, appsecret);
var path = require('path');
var type = 'image';
var filepath = path.join(__dirname, '../public/img.jpg');
var gm = require('gm');

// -----------------------------------------------------------------
function log(info) {
  console.log("-----------------------------------");
  var length = arguments.length;
  for (var i = 0; i < length; i++) {
    console.log(arguments[i]);
  }
}
// access_token = 'xeupaqxXJIGgSBdjd9oQCuhk8jXyyk88q6w6TxrsaCeymcvQg1gqXeRmgrLQl9313k1owiiuMLbQWYbrSidVglGH-Xfb-3-lgGIeLkQncCAXYCjACAQRV'

// -----------------------------------------------------------------

log('type: ' + type, 'filepath: ' + filepath);
api.uploadMedia(filepath, type, function(err, result) {
	if(err) {
		log("upload image error", err);
	} else {
		log("upload image succeed", result);
	}
});


// -----------------------------------------------------------------











// -----------------------------------------------------------------





