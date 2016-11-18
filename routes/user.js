var isodate = require("isodate");

var encrypt_password = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'anvitaebay';

function encrypt(text){
  var cipher = encrypt_password.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = encrypt_password.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

var winston_logger = require('winston')

var ejs = require('ejs');

var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebay";

var dateformat = require('dateformat');

var json_responses;

exports.loginCheck = function(req, res){
	
	  var username = req.param("username");
	  var password = req.param("password");
	  
	  var encryptPassword = encrypt(password)
	  
	  var found = false;
	  
	  mongo.connect(mongoURL, function(){   
			
			var coll = mongo.collection('users');
			
			coll.find({username: username, password: encryptPassword}).toArray(function(err, results) {
					if(err) {
						throw err;
					} else {
						if(results.length > 0) {
							
							var str = JSON.stringify(results[0]);
							var user = JSON.parse(str);
							var firstname = user.firstname;
							
							var lastdate=dateformat(results[0].last_login, "mm/dd/yyyy");
							
							var date = new Date(results[0].last_login);
							
							var hours = date.getHours();
							var minutes = date.getMinutes();
							var lasttime = hours+":"+minutes;
							var lastlogin = lastdate +' at '+lasttime+' PM PST';
							
							req.session.destroy();
							
							req.session.username = username;
							req.session.firstname = firstname
							req.session.lastlogin = lastlogin;
							
							console.log("Session initialized");
							console.log("Session username is "+req.session.username);
							console.log("Session firstname is "+req.session.firstname);
							console.log("Session lastlogin is "+req.session.lastlogin);
							
							winston_logger.log('info', 'user - '+req.session.username+' - successfully in login');
							
							var current = new Date();
							var newLogin = dateformat(current, "yyyy-mm-dd HH:MM:ss");
							
							coll.update(
									{
										username:username
									},
									{
										$set: {
											last_login : newLogin
											  }
									}), function(err, user){ 
										if(err) {
											throw err;
										} else {
											//console.log("last login updated successfully");
										}
								};
							
							loginResponse = {"statuscode":200};
							res.send(loginResponse);
						
						}else{
							winston_logger.log('info', 'Invalid login attempt with username  '+username);
							
							console.log("Invalid Login");
							loginResponse = {"statuscode":401};
							res.send(loginResponse);
						}
					}
				});
			});

};


exports.getHomepage =  function(req,res){
	var cart = 0;
	
	if(req.session.username)
	{	
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		winston_logger.log('info', 'user - '+req.session.username+' - redirected to homepage');
		

		mongo.connect(mongoURL, function(){   
		
		var coll = mongo.collection('users');
		
		coll.find({username:req.session.username}).toArray(function(err, user) {

			if(err) {
				throw err;
			} else {
			cart = user[0].cart.length;
			
			ejs.renderFile('./views/homepage.ejs', {title: 'Welcome to Ebay', firstname: req.session.firstname, cart: cart, lastlogin:req.session.lastlogin } , function(err, result) {
					if(!err){
						res.end(result);
					}
					else{
						res.end('An error occurred');
						console.log(err);
					}
				});
			
		}
		});
	});
	}else
	{
		res.redirect('/');
	}
}


exports.successuser = function(req,res){
	var cart = 0;
	var products;
	
	if(req.session.username)
	{
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		winston_logger.log('info', 'user - '+req.session.username+' - redirected to frontpage to view all products');
		
		mongo.connect(mongoURL, function(){
		var coll_users = mongo.collection('users');
			
		coll_users.find({username:req.session.username}).toArray(function(err, user) {

			if(err) {
				throw err;
			} else {
				
			cart = user[0].cart.length;
					
			var coll_items = mongo.collection('items');
			coll_items.find({seller_username: { $nin: [req.session.username] } }).toArray(function(err, items) {
				if(err) {
					throw err;
				} else {
					if(items.length > 0){
						for(i in items){
							if(items[i].bid == 1)
							{
								console.log("bids are");
								console.log(items[i].bids)
							}
					}

				}
				
				var str = JSON.stringify(items);
				
				products =  JSON.parse(str);
				
				ejs.renderFile('./views/firstpage.ejs', {title: 'Welcome', user: req.session.firstname, values: products, cart: cart, lastlogin: req.session.lastlogin } , function(err, result) {
						if (!err) {
							res.end(result);
						}
						else {
							res.end('An error occurred');
							console.log(err);
						}
					});
			}
				});
		}
			});
		});
	}
	else
	{
		res.redirect('/');
	}
}

exports.sellItemDetails = function(req,res){
	
	if(req.session.username){
		
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		winston_logger.log('info', 'user - '+req.session.username+' - trying to add a new item');
		
		var type = req.param("type");
		var title = req.param("title");
		var details = req.param("details");
		var condition = req.param("condition");
		var price = req.param("price");
		var quantity = req.param("quantity");
		var bid = req.param("bid");
		var seller_state = req.param("seller_state");
		
		var currentTime = new Date();
		var insertTime =  new Date();
		var bid_endtime;

		if(bid == 1){
			bid_endtime =  new Date(currentTime.setTime( currentTime.getTime() + 4 * 86400000 ));
		}else{
			bid_endtime = null;
		}
		mongo.connect(mongoURL, function(){

			var coll_users = mongo.collection('users');
			var coll_items = mongo.collection('items');

			coll_items.find().sort({_id:-1}).limit(1).toArray(function(err, maxID) {
				var newID;

				console.log("output is")
				console.log(maxID)

					if(maxID.length > 0){
						var maxID = maxID[0]._id;
						newID = maxID + 1;	
					}else{
						newID = 1;
					}
					coll_items.insert({_id: newID, item_code: newID, bids: [], image: "", bid: bid, bid_status: 0, item_type: type, description: title, condition_prod: condition, details: details, seller_username: req.session.username, seller_state: seller_state, price: price, quantity: quantity, insert_time: dateformat(insertTime,"yyyy-mm-dd HH:MM:ss"), bid_endtime: dateformat(bid_endtime,"yyyy-mm-dd HH:MM:ss") }, function(err, user){

				if(err) {
					throw err;
				} else {
						//
					}
				});

				winston_logger.log('info', 'user - '+req.session.username+' - added a new item in database successfully');
					
					itemAddResponse={"statuscode":200}
					res.send(itemAddResponse);
			});
			});
	
	}else
	{
		res.redirect('/');
	}
	
};


exports.newItemSuccess = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		winston_logger.log('info', 'user - '+req.session.username+' - notified that new item was successfully added');
		
		mongo.connect(mongoURL, function(){

			var coll_users = mongo.collection('users');

			winston_logger.log('info', 'user - '+req.session.username+' - selected to proceed with checkout');

			coll_users.find({username:req.session.username}).toArray(function(err, user) {
				if(err) {
						throw err;
					} else {
						cart = user[0].cart.length;

						ejs.renderFile('./views/newItemSuccess.ejs', { title: 'Thank You', firstname: req.session.firstname, lastlogin: req.session.lastlogin, cart: cart } , function(err, result) {
						if (!err) {
							res.end(result);
						}
						else {
							res.end('An error occurred');
							console.log(err);
						}
					});

					}
			});
			});
	}else{
		res.redirect('/');
	}
}

exports.loadCardPage = function(req,res){
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		winston_logger.log('info', 'Redirecting user '+req.session.username+' to ask card details for payment');
		
		winston_logger.log('info', 'user - '+req.session.username+' - selected to proceed with checkout');
		
		mongo.connect(mongoURL, function(){

			var coll_users = mongo.collection('users');

			coll_users.find({username:req.session.username}).toArray(function(err, user) {
				if(err) {
						throw err;
					} else {
						cart = user[0].cart.length;

					ejs.renderFile('./views/creditCard.ejs', { title: 'Payment', firstname: req.session.firstname, lastlogin: req.session.lastlogin, cart: cart } , function(err, result) {
						if (!err) {
							res.end(result);
						}
						else {
							res.end('An error occurred');
							console.log(err);
						}
					});

					}
			});

			});
		
	}else{
		res.redirect('/');
	}
	
}

exports.takePayment = function(req,res){
	
	if(req.session.username){
		
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		var ccnumber = req.param("ccnumber");
		var firstname = req.param("firstname");
		var lastname = req.param("lastname");
		var cvv = req.param("cvv");
		var expiry = req.param("expiry");
		
		var valid = true;
		
		if(ccnumber.length != 16 || cvv.length != 3 || firstname == null || lastname == null)
			ccValidation = {"statuscode":401}
		else
			ccValidation = {"statuscode":200}
		
		console.log("From user");
		console.log(req.session.username);	
		
		winston_logger.log('info', 'Validating credit card details for payment from user - '+req.session.username);
		
		res.send(ccValidation);
	}
	else
	{
		res.redirect('/');
	}
}

exports.updateCart = function(req,res){
	if(req.session.username){
		
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		var item_code = req.param("item_code");
		var new_qty = req.param("new_qty");
		winston_logger.log('info', 'user - '+req.session.username+' - updating quantity of item '+item_code+' in cart');
		
		mongo.connect(mongoURL, function(){

			var coll_users = mongo.collection('users');

			coll_users.find({username:req.session.username}).toArray(function(err, user) {
				if(err) {
					throw err;
				} else {

					var newCart = [];

					for(i in user[0].cart){
						if(user[0].cart[i].item_code == item_code){
							newItem = {
								"item_code" : item_code,
								"quantity" : new_qty
							}

							newCart.push(newItem);

						}else{
							newCart.push(user[0].cart[i])
						}
					}
			
					coll_users.update(
							{
								username: req.session.username
							},
							{
								$set: {
									cart : newCart
									  }
							}), function(err, user){ 
								if(err) {
									throw err;
								} else {
									winston_logger.log('info', 'user - '+req.session.username+' - successfully removed item '+req.session.item.item_code+' from cart');
						
									updateResponse = {"statuscode":200}
									res.send(updateResponse);
								}
						};
						updateResponse = {"statuscode":200}
						res.send(updateResponse);
				}
			});	
			});
		
	}else{
		res.redirect('/');
	}
}

exports.addCart = function(req,res){
	
	if(req.session.username){
		
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
	var item_code = req.param("item");
	var quantity = req.param("quantity");
	
	winston_logger.log('info', 'user - '+req.session.username+' - attempting to add item '+req.session.item.item_code+' to cart');
	
	console.log(" in add to cart session desc is "+ req.session.item.description);
	
	mongo.connect(mongoURL, function(){

		var coll_users = mongo.collection('users');

		coll_users.find({username:req.session.username}).toArray(function(err, user) {
			if(err) {
				throw err;
			} else {
				var newCart = [];

				if(user[0].cart.length > 0){
					for(i in user[0].cart){
						newCart.push(user[0].cart[i])
					}
					item = {
							"item_code": item_code,
							"quantity": quantity
						}
						newCart.push(item)
				}else{
					item = {
						"item_code": item_code,
						"quantity": quantity
					}

					newCart.push(item)
				}

				coll_users.update(
						{
							username: req.session.username
						},
						{
							$set: {
								cart : newCart
								  }
						}), function(err, user){ 
							if(err) {
								throw err;
							} else {
								//console.log("new bid added successfully");
							}
					};
					
					itemAddResponse={"statuscode":200}
					res.send(itemAddResponse);
			}
		});	
		});
}
	else
	{
		res.redirect('/');
	}
}

exports.addCartSuccess = function(req,res){
	
	if(req.session.username){
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	winston_logger.log('info', 'user - '+req.session.username+' - notified that item was successfully added to cart');
	
	ejs.renderFile('./views/cartSuccess.ejs', { title: 'Thank You', item: req.session.item } , function(err, result) {
		if (!err) {
			res.end(result);
		}
		else {
			res.end('An error occurred');
			console.log(err);
		}
		});
	}else{
		res.redirect('/')
	}
}

exports.removeCart = function(req,res){
	
	if(req.session.username){
		
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		var cart_id = req.param("cart_id");
		winston_logger.log('info', 'user - '+req.session.username+' - removing item '+cart_id+' from cart');
		
		mongo.connect(mongoURL, function(){

			var coll_users = mongo.collection('users');

			coll_users.find({username:req.session.username}).toArray(function(err, user) {
				if(err) {
					throw err;
				} else {

					var newCart = [];
					
					for(i in user[0].cart){
						if(user[0].cart[i].item_code == cart_id){
							//do nothing
						}else{
							newCart.push(user[0].cart[i])
						}
					}
			
					console.log("trying to update")
					
					mongo.connect(mongoURL, function(){

						var coll_users1 = mongo.collection('users');
							console.log("in here")
					coll_users1.update(
							{
								username: req.session.username
							},
							{
								$set: {
									cart : newCart
									  }
							}), function(err, user1){ 
								if(err) {
									throw err;
								} else {
									deleteResponse={"statuscode":200}
									res.send(deleteResponse)
								}
						};
					});	
					winston_logger.log('info', 'user - '+req.session.username+' - successfully removed item '+cart_id+' from cart');
					deleteResponse={"statuscode":200}
					res.send(deleteResponse)
						
				}
			});	
			});
	}else
	{
		res.redirect('/');
	}
}

exports.proceedtocheck = function(req,res){
	
	var cart;
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		winston_logger.log('info', 'user - '+req.session.username+' - selected to proceed with checkout');
		
		mongo.connect(mongoURL, function(){

			var coll_users = mongo.collection('users');

			coll_users.find({username:req.session.username}).toArray(function(err, user) {
				if(err) {
						throw err;
					} else {
						cart = user[0].cart.length;

						var str = JSON.stringify(user);
					var cartItems = JSON.parse(str);
					
					var passError = 0;
					
					for(i in cartItems){
						if(cartItems[i].quantity >= cartItems[i].available)
							passError = 1;
					}
					
					if(passError){
						checkoutResponse = {"statuscode":201}
					}else{
						checkoutResponse = {"statuscode":200}
					}
					res.send(checkoutResponse);

					}
			});
		});

	}else{
		res.redirect('/');
	}
}

exports.getCart = function(req,res){
	var cartItems;
	var total = 0;
	
	if(req.session.username)
		{
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
			winston_logger.log('info', 'user - '+req.session.username+' - redirected to view items in cart');
			
			mongo.connect(mongoURL, function(){

				var coll_users = mongo.collection('users');
					
				coll_users.find({username:req.session.username}).toArray(function(err, user) {
					if(err) {
						throw err;
					} else {
						cart = user[0].cart.length;

						var cartItems = [];
						var itemsInCart = [];
						for(i in user[0].cart){
							itemsInCart.push(Number(user[0].cart[i].item_code));
						}

						var coll_items = mongo.collection('items');
						coll_items.find({ item_code: { $in: itemsInCart  }   }).toArray(function(err, items) {
							if(err) {
								throw err;
							} else {
								var display;
								var total = 0;
								
								if(items.length > 0){
									display = 1;
								
									cartItems = items;
									
									//console.log("cartItems are")
									//console.log(cartItems)
									
									for(i in cartItems){
										cartItems[i].available = cartItems[i].quantity;
										for(j in user[0].cart){
											if(user[0].cart[j].item_code == cartItems[i].item_code){
												cartItems[i].quantity = user[0].cart[j].quantity;
											}
										}
										total = total + (cartItems[i].price * cartItems[i].quantity) 
									}
								}else{
									display = 0;
								}		
									
								ejs.renderFile('./views/cart.ejs', { title: 'My Cart', lastlogin: req.session.lastlogin, display: display, cartItems: cartItems, cart: cart, user: req.session.firstname, total: total } , function(err, result) {
									if (!err) {
										res.end(result);
									}
									else {
										res.end('An error occurred');
										console.log(err);
									}
								});
									
								}
							});
							
							}
				});
			});
			
			
	}
	else{
			res.redirect('/');
		}
}


exports.sellForm = function(req, res){
	
	if(req.session.username){
		
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');	
		
	winston_logger.log('info', 'user - '+req.session.username+' - views sell page to try to add a new item for sale');
	
	var checkType = req.param("type");
	
	sellType={"statuscode":200};
	res.send(sellType);
	}
	else
	{
		res.redirect('/');
	}
	
};

exports.redirectSellForm = function(req,res){
	if(req.session.username){
		
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	mongo.connect(mongoURL, function(){

		var coll_users = mongo.collection('users');

		coll_users.find({username:req.session.username}).toArray(function(err, user) {
			if(err) {
					throw err;
				} else {
					cart = user[0].cart.length;

ejs.renderFile('./views/sellForm.ejs', { title: 'Ebay Sell', username: req.session.username, firstname: req.session.firstname, cart: cart  } , function(err, result) {
	if (!err) {	
		res.end(result);
	}
	else {
		res.end('An error occurred');
		console.log(err);
	}
});

				}
		});

		});
	
	}else{
		res.redirect('/');
	}
}

exports.addDOB = function(req,res){
	var dob = req.param("dob");


	mongo.connect(mongoURL, function(){

	var coll_users = mongo.collection('users');

			coll_users.update(
						{
							username: req.session.username
						},
						{
							$set: {
								dob : dob
								  }
						}), function(err, user){ 
							if(err) {
								throw err;
							} else {
								winston_logger.log('info', 'user - '+req.session.username+' - successfully updated date of birth ');
					
								dobUpdate = {"statuscode":200};
								res.send(dobUpdate);
							}
					};
	});
		
}

exports.addLocation = function(req,res){
	var location = req.param("location");
	

	mongo.connect(mongoURL, function(){

	var coll_users = mongo.collection('users');

			coll_users.update(
						{
							username: req.session.username
						},
						{
							$set: {
								location : location
								  }
						}), function(err, user){ 
							if(err) {
								throw err;
							} else {
								winston_logger.log('info', 'user - '+req.session.username+' - successfully updated date of birth ');
					
								dobUpdate = {"statuscode":200};
								res.send(dobUpdate);
							}
					};
	});
		
}

exports.addGender = function(req,res){
	var gender = req.param("gender");
	
	mongo.connect(mongoURL, function(){

		var coll_users = mongo.collection('users');

				coll_users.update(
							{
								username: req.session.username
							},
							{
								$set: {
									gender : gender
									  }
							}), function(err, user){ 
								if(err) {
									throw err;
								} else {
									winston_logger.log('info', 'user - '+req.session.username+' - successfully updated date of birth ');
						
									dobUpdate = {"statuscode":200};
									res.send(dobUpdate);
								}
						};
		});
		
}

exports.getAccountDetails = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		

		mongo.connect(mongoURL, function(){

		var coll_users = mongo.collection('users');

		coll_users.find({username:req.session.username}).toArray(function(err, user) {
			if(err) {
				throw err;
			} else {

				cart = user[0].cart.length;

				winston_logger.log('info', 'user - '+req.session.username+' - redirects to view account details');

				var userinfo = user[0];


				ejs.renderFile('./views/account.ejs', { title: 'My Account', username: req.session.username, firstname: req.session.firstname, cart : cart, lastlogin: req.session.lastlogin, user : userinfo   } , function(err, result) {
				if (!err) {	
					res.end(result);
				}
				else {
					res.end('An error occurred');
					console.log(err);
				}
			});
			}
		});	
		});
		
	}else{
		res.redirect('/');
	}
	
}

exports.checkout = function(req,res){
	if(req.session.username)
	{
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		winston_logger.log('info', 'Payment for user - '+req.session.username+' - successfully processed');
		
		console.log("checkout for ",req.session.username)
		
		mongo.connect(mongoURL, function(){

			var products;
			var totalPriceBuyer = 0;
			var checkoutItems = [];

			var coll_users = mongo.collection('users');
			var coll_items = mongo.collection('items');

			coll_users.find({username:req.session.username}).toArray(function(err, results) {
				if(err) {
						throw err;
					} else {
					
					if(results.length > 0){
						console.log("found user")
						var user = results[0];
						var cart = results[0].cart;
						var itemsInCart = [];
						
						if(cart.length > 0){
							console.log("cart has")
							for(i in cart)
								itemsInCart.push(Number(cart[i].item_code))
							
							
							coll_items.find({   item_code: { $in: itemsInCart  }    }).toArray(function(err, items) {	
								if(err) {
									throw err;
								} else {

									//fetch quantities to be updated and get total price to be deducted from buyer
									var cartItemDetails = [];
									for(i in cart){
										for(j in items){
											if(Number(items[j].item_code) == Number(cart[i].item_code)){
												var price = Number(cart[i].quantity) * Number(items[j].price)
												json = {"item_code": cart[i].item_code, "quantity": cart[i].quantity, "price": price}
												cartItemDetails.push(json);
											}
										}
									}
									
									var sellers = [];
									
									//fetch account to be updated for each seller
									for(i in cartItemDetails){
										for(j in items){
											if(Number(items[j].item_code) == Number(cartItemDetails[i].item_code)){
												var exists = 0; var index;
												for(x in sellers)
												{
													if(sellers[x].seller == items[j].seller_username)
													{	
														console.log("already exists")
														exists = 1;
														index = x;
													}
												}
												
												if(exists)
												{
													sellers[index].amount = sellers[index].amount + amt;
												}else{
													var json = { "seller" : items[j].seller_username, "amount" : cartItemDetails[i].price}
													sellers.push(json)
												}	
											}
										}
									}
									
									console.log("sellers")
									console.log(sellers)
									
									//get order id to insert
									var orderid;
									var maxOrderId = 1;
									
									if(user.orders.length > 0){
										for(i in user.orders){
											if(Number(user.orders[i].orderid) > maxOrderId)
												maxOrderId = Number(user.orders[i].orderid);
										}
										orderid = maxOrderId + 1;
									}else{
										orderid = 1;
									}
									
									//create a new order
									var currentDate = new Date();
									var orderdate = dateformat(currentDate,"yyyy-mm-dd HH:MM:ss");
									var orderdate = dateformat(currentDate,"yyyy-mm-dd HH:MM:ss");
									var orders = [];
								
									for(x in user.orders){
										orders.push(user.orders[x])
									}
									
									console.log("cartdetails")
									console.log(cartItemDetails)
									for(i in cartItemDetails){
										for(j in items){
											if(Number(items[j].item_code) == Number(cartItemDetails[i].item_code)){
												json = {"orderid":orderid, "item_code":items[j].item_code, "orderdate":orderdate, "seller_username":items[j].seller_username, "buyer_username":req.session.username, "quantity":cartItemDetails[i].quantity, "bid":items[j].bid, "price":items[j].price}
												orders.push(json);
											}
										}
									}
									
									coll_users.update(
											{
												username: req.session.username
											},
											{
												$set: {
													orders : orders
													  }
											}), function(err, user){ 
												if(err) {
													throw err;
												} else {
													//new order placed successfully
													console.log("new order added")
												}
										};
											
										//update quantities in items table
										for(i in cartItemDetails){
											for(j in items){
												if(Number(items[j].item_code) == Number(cartItemDetails[i].item_code)){
													var new_qty = Number(items[j].quantity) - Number(cartItemDetails[i].quantity) 
													
													if(new_qty > 0){
														
														coll_items.update(
														{
															item_code: Number(cartItemDetails[i].item_code)
														},
														{
														$set: {
															quantity : new_qty
														 }
														}),function(err, user){ 
														if(err) {
															throw err;
														} else {
														//	console.log("item quantity updated successfully");
														};
														}
													}else{
														console.log("new quantity will go lower than 0");
													}
												}
											}
										}
										
										//update sellers account
										for(i in sellers){
												
											coll_users.update(
													{
														username: sellers[i].seller
													},
													{
													$inc: {
														account : Number(sellers[i].amount)
													 }
													})
												
													console.log("seller account updated")		
										}	
										
									//update buyers account
									
									var total = 0;
									
									for(i in cartItemDetails){
										total = total + cartItemDetails[i].price
									}
										
									coll_users.update(
											{
												username: req.session.username
											},
											{
											$inc: {
												account : Number(0) - Number(total)
											 }
											}),function(err,user){
										if(err){
											
										}else{
											console.log("buyer account deducted successfully")
										}
									}
										
									//delete from cart	
									coll_users.update(
											{
												username: req.session.username
											},
											{
											$set: {
												cart : []
											 }
											}),function(err,user){
										if(err){
											
										}else{
											console.log("cart deleted")
										}
									}
									
									
									winston_logger.log('info', 'Cart for user - '+req.session.username+' - processed; monetory transactions completed and inventory updated');
									
									ejs.renderFile('./views/paymentSuccess.ejs', { title: 'Congratulations'  } , function(err, result) {
										if (!err) {	
											res.end(result);
										}else {
											res.end('An error occurred');
											console.log(err);
										}
									});	
										
										
								}
								
							});
							
						}else{
							console.log("No items in cart to checkout");
						}
						
					}else{
						console.log("no such user");
					}
										
					
					
				}
			});
		});
		
		
	}
	else
	{
		res.redirect('/');
	}
};

exports.viewItem = function(req,res){
	
	if(req.session.username){
		
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		console.log("reached in item fetch")
		
		var item = req.param("item");
	
		var currentItem;
		
		mongo.connect(mongoURL, function(){
			var coll_items = mongo.collection('items');
			
			coll_items.find({item_code: Number(item)}).toArray(function(err, items) {
				
				if(err){
					throw err;
				}
				else{
					if(items.length > 0){	

						console.log("fetched items")
						
						currentItem = items[0];
						req.session.item = currentItem;
						
						winston_logger.log('info', 'User - '+req.session.username+' - clicks to view item '+req.session.item.item_code);
						
						console.log("sending response from viewItem");
						itemResponse={"item":currentItem, "statuscode":200}
						res.send(itemResponse);
					}
				}
			});
		});
	}
	else
	{
		res.redirect('/');
	}
}

exports.viewItemDetails = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
				
		mongo.connect(mongoURL, function(){
			var coll_users = mongo.collection('users');
			
			console.log("reached in viewItem details");
			
			coll_users.find({username:req.session.username}).toArray(function(err, user) {

				if(err) {
					throw err;
				} else {
					
				cart = user[0].cart.length;

				console.log("cart length is "+cart);
				
				var cartarr = [];

				for(i in user[0].cart){
					cartarr.push(user[0].cart.item_code);
				}

				var coll_items = mongo.collection('items');

				coll_items.find({item_code:req.session.item.item_code}).toArray(function(err, items) {
					if(err) {
						throw err;
					} else {
						
					var condition;
					var displayCart;
					
					switch(req.session.item.condition_prod){
						case 0: condition = 'New with box';
								break;
										
						case 1: condition = 'New without box';
								break;
						
						case 2: condition = 'Used';
								break;
								
						case 3: condition = 'Some parts not functioning';
								break;
								
						default: console.log("unknown condition");
								break;
					}

					var cartPresent = false;

					for(i in user[0].cart){
						if(user[0].cart[i].item_code == req.session.item.item_code){
							cartPresent = true; 
						}
					}

					if(cartPresent){
						displayCart = 0;
					}else{
						displayCart = 1;
					}	

					var maxBid = 0

					var bidCount;
					
					if(req.session.item.bids.length > 0){

						bidCount = req.session.item.bids.length;

						for(i in items.bids)
						{
							if(i.bid_amount > maxBid)
							maxBid = i.bid_amount;
						}

						//timer trial
						var days, hours;
						var deadline = dateformat(req.session.item.bid_endtime,"yyyy-mm-dd HH:MM:ss");
						getBidEndTime(deadline);
						function getBidEndTime(bidendtime){
							var totalTime = Date.parse(bidendtime) - Date.parse(new Date());
							minutes = Math.floor( (totalTime/1000/60) % 60 );
							hours = Math.floor( (totalTime/(1000*60*60)) % 24 );
							days = Math.floor( totalTime/(1000*60*60*24) );
						}
						//timer end

					}else{
						bidCount = 0;
						maxBid = req.session.item.price;
					}


					winston_logger.log('info', 'User - '+req.session.username+' - clicks to view item '+req.session.item.item_code);
											
					ejs.renderFile('./views/itemDetails.ejs', { title: 'View Item', days: days, hours: hours, item: req.session.item, username: req.session.username, firstname: req.session.firstname, cart: cart, condition: condition, displayCart: displayCart, bids: bidCount, maxBid: maxBid  } , function(err, result) {
						if (!err) {	
							res.end(result);
						}else {
							res.end('An error occurred');
							console.log(err);
						}
					});	
					}
				});
				}
			});

		});	
	}
	else
	{
		res.redirect('/');
	}
}

exports.bidDetails = function(req,res){
	
	if(req.session.username){
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	console.log("bid details")
	
	if(req.session.username){
	
		response = {"statuscode":200}
		res.send(response);
		}
	
	}else{
		res.redirect('/');
	}
}

exports.getBidDetails = function(req,res){
	
	if(req.session.username)
	{
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		var cart;
		
		mongo.connect(mongoURL, function(){

			var coll_users = mongo.collection('users');
				
			coll_users.find({username:req.session.username}).toArray(function(err, user) {

				if(err) {
					throw err;
				} else {
					cart = user[0].cart.length;
					var coll_items = mongo.collection('items');
				
					coll_items.find({item_code: req.session.item.item_code}).toArray(function(err, bidDetails) {
						if(err) {
							throw err;
						} else {
							var bids = bidDetails[0].bids;

							for(i in bids){
								var day=dateformat(bids[i].bid_time, "yyyy-mm-dd HH:MM:ss");
								bids[i].bid_time = day;
							}

							winston_logger.log('info', 'User - '+req.session.username+' - views bids for item '+req.session.item.item_code);
						
							ejs.renderFile('./views/bidDetails.ejs', { title: 'Item Bid History', item: req.session.item, username: req.session.username, firstname: req.session.firstname, cart: cart, bids: bids  } , function(err, result) {
							if (!err) {
								res.end(result);
							}
							else {
								res.end('An error occurred');
								console.log(err);
							}
						});	
						}
					});
				}
			});
		});	
	}
	else
	{
		res.redirect('/');
	}
}

exports.addBid = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	var bid = req.param("bid");
	
	var maxBid = 0;
	var maxBidUser;
	
	var bidstoInsertBack = [];
	
	for(i in req.session.item.bids){
		
		bidstoInsertBack.push(req.session.item.bids[i]);
		
		if(req.session.item.bids[i].bid_amount > maxBid){
			maxBid = req.session.item.bids[i].bid_amount;
			maxBidUser = req.session.item.bids[i];
		}

		console.log("bids are - 1")
		console.log(bidstoInsertBack)

	}
	
	if(bid > maxBid && bid > req.session.item.price){
		var currentTime = new Date();
		
		console.log("date is "+currentTime)
			
		
		var newBid = {
			"bid_username": req.session.username,
			"bid_amount": bid,
			"bid_time": dateformat(currentTime, "yyyy-mm-dd HH:MM:ss"),
		}
		
		bidstoInsertBack.push(newBid);

		console.log("bids are")
		console.log(bidstoInsertBack)
		
		mongo.connect(mongoURL, function(){

			var coll_items = mongo.collection('items');
			
			coll_items.update(
					{
						item_code: req.session.item.item_code
					},
					{
						$set: {
							bids : bidstoInsertBack
							  }
					}), function(err, user){ 
						if(err) {
							throw err;
						} else {
							//console.log("new bid added successfully");
						}
				};
		});
	}
	}else{
		res.redirect('/');
	}
		
}

exports.signupsuccessredirect = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	winston_logger.log('info', 'Account created for new user with username - '+req.session.username);
	
	console.log("in signup success the user name is ",req.session.username);
	console.log("and firstname is", req.session.firstname)
	ejs.renderFile('./views/signupsuccess.ejs', { title: 'Welcome to Ebay', username: req.session.username, firstname: req.session.firstname  } , function(err, result) {
		if (!err) {
			res.end(result);
		}
		else {
			res.end('An error occurred');
			console.log(err);
		}
	});
	
	}else{
		res.redirect('/');
	}
};

exports.submitSignup = function(req,res){
	var firstname = req.param("firstname");
	var lastname = req.param("lastname");
	var email = req.param("email");
	var email2 = req.param("email2");
	var mobile = req.param("mobile");
	var password = req.param("password");
	
	winston_logger.log('info', 'Signup attempt for user with firstname '+firstname);
	
	var insert_check = false;
	
	if(email != email2)
	{
		console.log("emails not equal");
		signupResponse={"statuscode": 300}
		res.send(signupResponse);
	}
	else
	{
		console.log("email is "+email);
		console.log("firstname is "+firstname);
	
		 mongo.connect(mongoURL, function(){
			 	var coll_users = mongo.collection('users');

			 	coll_users.find({email: email}).toArray(function(err, email_data) {
							if(email_data.length > 0) {
								console.log("email exists");
								
								signupResponse={"statuscode":401}
								res.send(signupResponse);

							} else {
								var username = (firstname.toLowerCase().substring(0,4)) + (lastname.toLowerCase().substring(0,5));
							
								coll_users.find({username: username}).toArray(function(err, username_data) {
										if(err) {	
											throw err;
										}else{
											if(username_data.length > 0){	
												console.log("username exists");
												username = username + Math.floor((Math.random() * 100) + 1);
											}

											password = encrypt(password);
										
											var current = new Date();
											var newLogin = dateformat(current, "yyyy-mm-dd HH:MM:ss");	

											//find maximum _id from users table
											coll_users.find().sort({_id:-1}).limit(1).toArray(function(err, maxID) {
												
												var newID
												if(maxID.length > 0){
													var maxID = maxID[0]._id;
													newID = maxID + 1;	
												}else{
													newID = 1;
												}
												
												coll_users.insert({_id : newID, firstname : firstname, lastname : lastname, username: username, password:password, email: email, mobile: mobile, last_login: newLogin, dob: "-", gender: "-", account: 10000, location: "-", items_sold:[], cart: [], orders: []}, function(err, user){  
													if(err) {     
														throw err;  
													} else {     
														
													console.log("user added successfully ",username)
													
													req.session.destroy();
													
													req.session.username = username;
													req.session.firstname = firstname;
													
													console.log("session started ")
													console.log(req.session.username)
													console.log(req.session.firstname)
													
													winston_logger.log('info', 'User - '+req.session.username+' - successfully signed up');
													
													console.log(" In signup")
													console.log("session username ", req.session.username)
													console.log("session firstname ", req.session.firstname)
													
													signupResponse={"statuscode":200}
													res.send(signupResponse);

														}  
												});
												
											});
										}
								});
							}
						});
			 });		
	}
};


exports.getSummary = function(req,res){
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	var cart;
	
		mongo.connect(mongoURL, function(){
	
			var coll_users = mongo.collection('users');
				
			coll_users.find({username:req.session.username}).toArray(function(err, user) {
	
				if(err) {
					throw err;
				} else {
					
					cart = user[0].cart.length;
	
					winston_logger.log('info', 'User - '+req.session.username+' - views account summary');
				
					ejs.renderFile('./views/summary.ejs', { title: 'Summary', username: req.session.username, user: req.session.firstname, cart: cart, lastlogin: req.session.lastlogin  } , function(err, result) {
					if (!err) {
						res.end(result);
					}
					else {
						res.end('An error occurred');
						console.log(err);
					}
				});
				}
			});
		});		
	
	
	}else{
		res.redirect('/');
	}	
};

exports.getSummaryOrders = function(req,res){
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

		var cart;
		var customerOrders = [];
		var display = 0;
		var summaryOrder = [];
		var finalorders;

		mongo.connect(mongoURL, function(){

			var coll_users = mongo.collection('users');
			var coll_items = mongo.collection('items');

			coll_users.find({username:req.session.username}).toArray(function(err, user) {

				if(err) {
					throw err;
				} else {

					cart = user[0].cart.length;

					if(user[0].orders.length > 0){

						display = 1;
						var orders = user[0].orders;
						var items_codes = [];
						var orderDetails = [];


						for(i in orders){
							json = {"orderid":orders[i].orderdate, "item_code": Number(orders[i].item_code)}
							orderDetails.push(json);
							items_codes.push(Number(orders[i].item_code))
						}

						coll_items.find({ item_code: { $in: items_codes  }   }).toArray(function(err, items) {
							if(err) {
								throw err;
							} else {

								for(i in items){
									for(j in orderDetails){
										if(Number(orderDetails[j].item_code) == Number(items[i].item_code) ){


											json = {"item_type":items[i].item_type, "description":items[i].description, "price":items[i].price,
												"quantity": items[i].quantity, "orderdate":orderDetails[j].orderdate,
												"bid": items[i].bid, "seller_username":items[i].seller_username, "image":items[i].image}

											summaryOrder.push(json)

										}
									}
								}

								var str = JSON.stringify(summaryOrder);

								finalorders =  JSON.parse(str);

								console.log("final orders")
								console.log(finalorders)

								winston_logger.log('info', 'User - '+req.session.username+' - views account summary for ordered items');

								ejs.renderFile('./views/summaryOrders.ejs', { title: 'Summary', display: display, username: req.session.username, user: req.session.firstname, cart: cart, orders: finalorders, lastlogin: req.session.lastlogin  } , function(err, result) {
									if (!err) {
										res.end(result);
									}
									else {
										res.end('An error occurred');
										console.log(err);
									}
								});
							}
						});

					}else{
						display = 0;

						ejs.renderFile('./views/summaryOrders.ejs', { title: 'Summary', display: 0, username: req.session.username, user: req.session.firstname, cart: cart, lastlogin: req.session.lastlogin  } , function(err, result) {
							if (!err) {
								res.end(result);
							}
							else {
								res.end('An error occurred');
								console.log(err);
							}
						});
					}

				}
			});
		});
	}else{
		res.redirect('/');
	}
		
};

exports.getSummarySold = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');


		var cart;
		var customerSold = [];
		var display = 0;
		var summarySold = [];
		var finalSold;

		mongo.connect(mongoURL, function(){

			var coll_users = mongo.collection('users');
			var coll_items = mongo.collection('items');

			coll_users.find({username:req.session.username}).toArray(function(err, user) {

				if(err) {
					throw err;
				} else {

					cart = user[0].cart.length;

					if(user[0].items_sold.length > 0){

						display = 1;
						var sold = user[0].items_sold;
						var items_codes = [];

						for(i in sold){

							items_codes.push(Number(sold[i].item_code))
						}

						coll_items.find({ item_code: { $in: items_codes  }   }).toArray(function(err, items) {
							if(err) {
								throw err;
							} else {

								for(i in items){
									for(j in items_codes){
										console.log("here")
										if(items_codes[j] == items[i].item_code ){

											console.log("here - 1")
											json = {"item_type":items[i].item_type, "description":items[i].description, "price":items[i].price,
												"quantity": 1, "insert_time":items[i].insert_time,
												"bid": items[i].bid, "image":items[i].image}

											summarySold.push(json)

										}
									}
								}

								var str = JSON.stringify(summarySold);

								finalSold =  JSON.parse(str);

								winston_logger.log('info', 'User - '+req.session.username+' - views account summary for sold items');

								ejs.renderFile('./views/summarySold.ejs', { title: 'Summary', display: display, username: req.session.username, user: req.session.firstname, lastlogin: req.session.lastlogin, cart: cart, sold: finalSold  } , function(err, result) {
									if (!err) {
										res.end(result);
									}
									else {
										res.end('An error occurred');
										console.log(err);
									}
								});
							}
						});

					}else{
						display = 0;

						console.log("cart is ")
						console.log(cart)

						ejs.renderFile('./views/summarySold.ejs', { title: 'Summary', display: 0, username: req.session.username, user: req.session.firstname, lastlogin: req.session.lastlogin, cart: cart  } , function(err, result) {
							if (!err) {
								res.end(result);
							}
							else {
								res.end('An error occurred');
								console.log(err);
							}
						});
					}


				}
			});
		});


	}else{
		res.redirect('/');
	}
}

exports.getSummaryActive = function(req,res){
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

		var cart;
		var customerSold = [];
		var display = 0;
		var summaryActive = [];
		var finalActive;

		mongo.connect(mongoURL, function(){

			var coll_users = mongo.collection('users');
			var coll_items = mongo.collection('items');

			coll_users.find({username:req.session.username}).toArray(function(err, user) {

				if(err) {
					throw err;
				} else {

					cart = user[0].cart.length;

					coll_items.find({ seller_username: req.session.username }).toArray(function(err, items) {
						if(err) {
							throw err;
						} else {

							if(items.length > 0){

								display = 1;

								for(i in items){
									json = {"item_type":items[i].item_type, "description":items[i].description, "price":items[i].price,
										"quantity": items[i].quantity, "insert_time":items[i].insert_time,
										"bid": items[i].bid, "image":items[i].image}

									summaryActive.push(json)
								}

								var str = JSON.stringify(summaryActive);

								finalActive =  JSON.parse(str);

								winston_logger.log('info', 'User - '+req.session.username+' - views account summary for active items');

								ejs.renderFile('./views/summaryActive.ejs', { title: 'Summary', display: display, username: req.session.username, user: req.session.firstname, lastlogin: req.session.lastlogin, cart: cart, active: finalActive } , function(err, result) {
									if (!err) {
										res.end(result);
									}
									else {
										res.end('An error occurred');
										console.log(err);
									}
								});
							}else{
								display = 0;

								ejs.renderFile('./views/summaryActive.ejs', { title: 'Summary', display: 0, username: req.session.username, user: req.session.firstname, lastlogin: req.session.lastlogin, cart: cart } , function(err, result) {
									if (!err) {
										res.end(result);
									}
									else {
										res.end('An error occurred');
										console.log(err);
									}
								});
							}

						}
					});

				}
			});
		});



	}else{
		res.redirect('/');
	}
}

exports.getSummaryBids = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

		var cart;
		var display = 0;
		var summaryBids = [];
		var finalBids;

		mongo.connect(mongoURL, function(){

			var coll_users = mongo.collection('users');
			var coll_items = mongo.collection('items');

			coll_users.find({username:req.session.username}).toArray(function(err, user) {

				if(err) {
					throw err;
				} else {

					cart = user[0].cart.length;

					coll_items.find({ bid: 1 }).toArray(function(err, items) {
						if(err) {
							throw err;
						} else {

							if(items.length > 0){

								display = 1;

								var bids = [];

								for(i in items){
									for(j in items[i].bids){
										if(items[i].bids[j].bid_username == req.session.username){

											json = {"item_type":items[i].item_type, "description":items[i].description, "price":items[i].price,
												"bid_amount": items[i].bids[j].bid_amount, "seller_username": items[i].seller_username, "bid_time":items[i].bids[j].bid_time,
												 "image":items[i].image}

											summaryBids.push(json)
										}
									}
								}

								var str = JSON.stringify(summaryBids);

								finalBids =  JSON.parse(str);


								winston_logger.log('info', 'User - '+req.session.username+' - views account summary for active items');

								ejs.renderFile('./views/summaryBids.ejs', { title: 'Summary', display: display, username: req.session.username, user: req.session.firstname, lastlogin: req.session.lastlogin, cart: cart, bids: finalBids } , function(err, result) {
									if (!err) {
										res.end(result);
									}
									else {
										res.end('An error occurred');
										console.log(err);
									}
								});
							}else{
								display = 0;

								ejs.renderFile('./views/summaryBids.ejs', { title: 'Summary', display: 0, username: req.session.username, user: req.session.firstname, lastlogin: req.session.lastlogin, cart: cart } , function(err, result) {
									if (!err) {
										res.end(result);
									}
									else {
										res.end('An error occurred');
										console.log(err);
									}
								});
							}

						}
					});



				}
			});
		});

	}else{
		res.redirect('/');
	}
}


exports.logout = function(req,res){
	
	winston_logger.log('info', 'User - '+req.session.username+' - selects to logout');
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	req.session.destroy();
	user = [];
	ejs.renderFile('./views/signout.ejs', { title: 'Thank You' } , function(err, result) {
		if (!err) {
			res.end(result);
		}
		else {
			res.end('An error occurred');
			console.log(err);
		}
	});
	}else{
		res.redirect('/');
	}
};
