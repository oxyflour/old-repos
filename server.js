var express = require('express'),
	app = express(),
	srv = require('http').Server(app),
	io = require('socket.io')(srv)

app.use('/share', express.static(__dirname+'/share'))
	.use(express.static(__dirname+'/html'))
srv.listen(18080)

// start server
new require('./share/game.js').Server(io)

// start a phantomjs page as host
require('phantom').create(function(ph) {
	ph.createPage(function(page) {
		page.open('http://localhost/?watch', function(status) {
			console.log('hosting: ', status)
		})
	})
})
