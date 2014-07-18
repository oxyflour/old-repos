// start a phantomjs page as host
require('phantom').create(function(ph) {
	ph.createPage(function(page) {
		page.open('http://localhost/?watch', function(status) {
			console.log('hosting: ', status)
		})
	})
})
