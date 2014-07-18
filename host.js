var page = require('webpage').create();
var url = 'http://localhost/?watch';
page.open(url, function (status) {
	console.log('loading :', status)
});
