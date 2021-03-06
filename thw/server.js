var express = require('express'),
	app = express(),
	srv = require('http').Server(app),
	io = require('socket.io')(srv)

app.use('/share', express.static(__dirname+'/share'))
	.use(express.static(__dirname+'/html'))
srv.listen(18080)
console.log('[S] listening at port 18080')

// start server
new require('./share/game.js').Server(io)
