var page = require('webpage').create();
var url = 'http://localhost:18080/?watch';
page.open(url, function (status) {
	console.log('load: ' + status)
});
