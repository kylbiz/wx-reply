# wx-reply
微信回复，微信公众号用户输入信息，返回信息，目前仅支持回复图片信息


### 使用方法
1. 微信服务器配置验证token，参考微信官方文档，有代码如下：

```javascript

	引用自：https://segmentfault.com/a/1190000003012131 
	日期： 2016-01-28

	var http = require("http");
	var url = require("url");
	var crypto = require("crypto");

	function sha1(str){
	  var md5sum = crypto.createHash("sha1");
	  md5sum.update(str);
	  str = md5sum.digest("hex");
	  return str;
	}

	function validateToken(req,res){
	  var query = url.parse(req.url,true).query;
	  //console.log("*** URL:" + req.url);
	  //console.log(query);
	  var signature = query.signature;
	  var echostr = query.echostr;
	  var timestamp = query['timestamp'];
	  var nonce = query.nonce;
	  var oriArray = new Array();
	  oriArray[0] = nonce;
	  oriArray[1] = timestamp;
	  oriArray[2] = "*********";//这里是你在微信开发者中心页面里填的token，而不是****
	  oriArray.sort();
	  var original = oriArray.join('');
	  console.log("Original str : " + original);
	  console.log("Signature : " + signature );
	  var scyptoString = sha1(original);
	  if(signature == scyptoString){
	    res.end(echostr);
	    console.log("Confirm and send echo back");
	  }else {
	    res.end("false");
	    console.log("Failed!");
	  }
	}


	var webSvr = http.createServer(validateToken);
	webSvr.listen(8000,function(){
	  console.log("Start validate");
	});

```
2. 配置微信信息 `config`

```javascript
	"wx": {
		appid: "", // wechat appid
		appsecret: "", // wechat appsecret
		errorMessage: "系统繁忙，请稍后重试！"
	}

```

3. `node app` 可以使用

欢迎各种 `issue`


### LICENSE: MIT
