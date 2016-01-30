# wx-reply
微信回复，微信公众号用户输入信息，返回信息，目前仅支持回复图片信息


### 使用方法
#### 微信服务器配置验证token，参考微信官方文档，有代码如下：

```javascript

        //引用自：https://segmentfault.com/a/1190000003012131 
	//日期： 2016-01-28

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
#### 配置微信信息 `config`

```javascript
	"wx": {
		appid: "", // wechat appid
		appsecret: "", // wechat appsecret
		errorMessage: "系统繁忙，请稍后重试！"
	}

```

#### 配置gm
参考 [gm文档](https://github.com/aheckmann/gm)

centos 服务器配置, mac平台其文档中有描述

* 安装  `GraphicsMagick` 或 `ImageMagick` 使用 yum 即可进行安装

* 需要安装 `freetype` 和 `ghostscript` 

* 需要字体包，这里提供 苹方字体 `pingfangregular.ttf`


#### 配置服务器 redis

* `# redis-server & `启动 redis 服务
* `$ redis-cli` 查看 redis 数据库
*  最好配置 redis 开机启动，但是我没有机会测试

#### `node app` 可以使用

注意：使用 `pm2` 启动程序，我发现执行链接文件时候，不能够打印水印，

但是，当直接执行原文件的时候，能够正确执行，不要问我原因，我现在也不晓得怎么回事，

所以，采用如下方式执行程序

`$ pm2 srart app.js --env production --name your_app_name -i -1`

欢迎各种 `issue`


### LICENSE: MIT
