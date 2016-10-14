var ejs = require('ejs');
var mysql = require('./mysql');

exports.index = function(req, res){
	  //  res.render('index', { title: 'Welcome to Anvita\'s eBay'});
	
	req.session.destroy();

	ejs.renderFile('./views/index.ejs', { title: 'Welcome to Ebay' } , function(err, result) {
			if (!err) {
				res.end(result);
			}
			else {
				res.end('An error occurred');
				console.log(err);
			}
		});
	};