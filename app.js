var restify = require("restify");
var port = 4987;

var MessageServer = require('./lib/message');
var Message = new MessageServer();

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


//-------------------------------------------------
server.listen(port, function() {
  console.log('listening: %s', server.url);
})

