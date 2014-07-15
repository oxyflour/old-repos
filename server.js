var express = require('express'),
	app = express(),
	srv = require('http').Server(app),
	io = require('socket.io')(srv)

srv.listen(80)

app.use('/share', express.static(__dirname+'/share'))
	.use('/three.js', express.static(__dirname+'/node_modules/three'))
	.use(express.static(__dirname+'/html'))

var game = require('./share/game.js').game
game.initWorld()
setInterval(function() {
	game.run(10)
}, 10)

var clients = { }
io.on('connection', function(socket) {
	var sid = socket.id
	clients[sid] = socket
	socket.emit('init', { sid:sid })
	console.log('client ' + sid + ' connected')

	var obj = new game.Player({ sid:sid })
	socket.broadcast.emit('sync+', game.getSyncData([obj]))

	socket.on('disconnect', function() {
		delete clients[sid]
		obj.finished = true
		socket.broadcast.emit('sync-', game.getSyncData([obj]))
		console.log('client ' + sid + ' disconnected')
	})

	socket.on('input', function(e) {
		e.sid = sid
		game.remoteInput(e)
	})

	setInterval(function() {
		socket.emit('sync', game.getSyncData())
	}, 100)
})
