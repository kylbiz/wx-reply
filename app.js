var restify = require("restify");
var port = 4987;

var MessageServer = require('./lib/message');
var Message = new MessageServer();

var imagePath = './canvas.jpg';
var gm = require('gm'); 


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
server.post('/wechat', Message.getMessage);

// server.post('/post', wechat(config, function (req, res, next) {
//   // 微信输入信息都在req.weixin上
//   var message = req.weixin;
//   console.log(message)
// }));




//-------------------------------------------------
server.listen(port, function() {
  console.log('listening: %s', server.url);
})

