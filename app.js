var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , session = require('client-sessions')
  , ejs = require('ejs');


var mysql = require("./routes/mysql");
var user = require("./routes/user");
var index = require("./routes/index");

mysql.createConnectionPool();

var winston_logger = require('winston')

winston_logger.add(
	winston_logger.transports.File, {
    filename: 'ebay-logs.log',
    level: 'info',
    json: true,
    eol: 'rn', 
    timestamp: true
  }
)

var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

var app = express();

// all environments
app.use(session({   
	  
	cookieName: 'session',    
	secret: 'cmpe273-session',    
	duration: 30 * 60 * 1000,    
	activeDuration: 5 * 60 * 1000,  }));
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.set('start', user.index);

var cronjob = require('node-cron-job');


cronjob.setJobsPath(__dirname + '/routes/scheduleBids.js');  // Absolute path to the jobs module. 
 
cronjob.startJob('bid_job');

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', index.index);
app.get('/allproducts',user.successuser);
app.get('/homepage', user.getHomepage);
app.get('/signupsuccess', user.signupsuccessredirect);
app.get('/sell', function(req, res){
  res.render('sell', { title: 'Ebay Sell'});
});
app.get('/myAccount', user.getAccountDetails);
app.get('/sellForm', user.redirectSellForm);
app.get('/summary',user.getSummary);
app.get('/summaryBids',user.getSummaryBids);
app.get('/summaryOrders',user.getSummaryOrders);
app.get('/summarySold',user.getSummarySold);
app.get('/summaryActive',user.getSummaryActive);
app.get('/creditcardvalidation', user.loadCardPage);
app.get('/paymentSuccess',function(req, res){
	  res.render('paymentSuccess', { title: 'Payment Success'});
	});
app.get('/paymentFailure',function(req, res){
	  res.render('paymentFailure', { title: 'Payment Failure'});
	});
app.get('/logout',user.logout);
app.get('/cart',user.getCart);
app.get('/addCartSuccess',user.addCartSuccess)
app.get('/checkout',user.checkout);
app.get('/itemDetails', user.viewItemDetails);
app.get('/bidDetails', user.getBidDetails);
app.get('/newItemSuccess',user.newItemSuccess);

app.post('/bidDetails', user.bidDetails)
app.post('/itemDetails', user.viewItem);
app.post('/submitLogin', user.loginCheck);
app.post('/submitSignUp', user.submitSignup);
app.post('/selltype', user.sellForm);
app.post('/sellItem', user.sellItemDetails);
app.post('/takePayment', user.takePayment);
app.post('/addcart', user.addCart);
app.post('/removeCart', user.removeCart);
app.post('/addBid', user.addBid);
app.post('/updateCart', user.updateCart);
app.post('/addDOB', user.addDOB);
app.post('/addLocation', user.addLocation);
app.post('/addGender', user.addGender);
app.post('/proceedCheck', user.proceedtocheck);


http.createServer(app).listen(app.get('port'), function(){
console.log('Server listening on port ' + app.get('port'));
//app.get('start');
}) 