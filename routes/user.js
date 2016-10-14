var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'anvitaebay';

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}
 

var ejs = require('ejs');
var mysql = require('./mysql');
var dateformat = require('dateformat');

var json_responses;

exports.loginCheck = function(req, res){
	
	  var username = req.param("username");
	  var password = req.param("password");
	  
	  var encryptPassword = encrypt(password)
	  
	  var found = false;
	  
	  var getQuery = "Select * from users where password = '"+encryptPassword+"' and (username = '"+username+"' or email = '"+username+"')";
	  
	  mysql.fetchData(function(err,results){
			if(err){
				throw err;
			}
			else{
				if(results.length > 0){
		
					var str = JSON.stringify(results[0]);
					var user = JSON.parse(str);
					var firstname = user.firstname;
		
					var lastdate=dateformat(results[0].last_login, "mm/dd/yyyy");
					var hours = results[0].last_login.getHours();
					var minutes = results[0].last_login.getMinutes();
					var lasttime = hours+":"+minutes;
					var lastlogin = lastdate +' at '+lasttime+' PM PST'
										
					req.session.destroy();
					
					req.session.username = username;
					req.session.firstname = firstname
					req.session.lastlogin = lastlogin;
					
					console.log("Session initialized");
					console.log("Session username is ",req.session.username);
					console.log("Session firstname is ",req.session.firstname);
					
					var current = new Date();
					var newLogin = dateformat(current, "yyyy-mm-dd HH:MM:ss");
					
					var updateLastLogin = "Update users set last_login = '"+newLogin+"' where username = '"+username+"'";
					
					 mysql.updateData(function(err,results){
							if(err){
								throw err;
							}
							else{
								
							}  },updateLastLogin);
					
					loginResponse = {"statuscode":200};
					res.send(loginResponse);
					
					}
				else {
						console.log("Invalid Login");
						loginResponse = {"statuscode":401};
						res.send(loginResponse);

					}   }  },getQuery);  
};

exports.getHomepage =  function(req,res){
	var cart = 0;
	
	if(req.session.username)
	{	
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		var getCart = "Select * from cart where username = ('"+req.session.username+"')";
		
		mysql.fetchData(function(err,cartdetails){
			if(err){
				throw err;
			}
			else{	
					cart = cartdetails.length;
					
					 ejs.renderFile('./views/homepage.ejs', {title: 'Welcome to Ebay', firstname: req.session.firstname, cart: cart, lastlogin:req.session.lastlogin } , function(err, result) {
							if (!err) {
								
								res.end(result);
							}
							else {
								res.end('An error occurred');
								console.log(err);
							}
						});	
			}
		},getCart);
		
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
		
		var getQuery = "Select items.*, count(bid_username) as bidcount from items left outer join bidding on items.item_code = bidding.item_code where seller_username != '"+req.session.username+"' group by items.item_code";
		
	//	var getQuery = "Select items.*, bids. from items where seller_username != ('"+req.session.username+"')";
		
		var getCart = "Select * from cart where username = ('"+req.session.username+"')";
		
		mysql.fetchData(function(err,cartdetails){
			if(err){
				throw err;
			}
			else{	
					cart = cartdetails.length;
					
					mysql.fetchData(function(err,results){
							if(err){
								throw err;
							}
							else{
								if(results.length > 0){
									
									var str = JSON.stringify(results);
									
									products =  JSON.parse(str);
									
									 ejs.renderFile('./views/firstpage.ejs', {title: 'Welcome', user: req.session.firstname, values: products, cart: cart} , function(err, result) {
											if (!err) {
												
												res.end(result);
											}
											else {
												res.end('An error occurred');
												console.log(err);
											}
										});	
									  
									}
								else {
										console.log("No products");

									}   }  },getQuery);
				}
			
		},getCart);
	}
	else
	{
		res.redirect('/');
	}

}

exports.sellItemDetails = function(req,res){
	
	if(req.session.username){
		
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
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
		var bbid_endtime;
		
		if(bid == 1){
			bid_endtime =  new Date(currentTime.setTime( currentTime.getTime() + 4 * 86400000 ));
		}else{
			bid_endtime = null;
		}
			
		var post  = {bid: bid, item_type: type, description: title, condition_prod: condition, details: details, seller_username: req.session.username, seller_state: seller_state, price: price, quantity: quantity, insert_time: insertTime, bid_endtime: bid_endtime };
		
		var table = 'items';
		
		mysql.insertRecord(function(err,results){
			
			if(err){
				throw err;
			}
			else
			{
				itemAddResponse={"statuscode":200}
				res.send(itemAddResponse);
			} 
		},post,table);
	
	}else
	{
		res.redirect('/');
	}
	
};


exports.newItemSuccess = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	ejs.renderFile('./views/newItemSuccess.ejs', { title: 'Thank You' } , function(err, result) {
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
		
		var updateQuantity = "Update cart set quantity = "+new_qty+" where item_code = "+item_code+" and username = '"+req.session.username+"'";
		
		 mysql.updateData(function(err,results){
				if(err){
					throw err;
				}
				else{
					
					updateResponse = {"statuscode":200}
					res.send(updateResponse);
					
				}  },updateQuantity);
		
	}else{
		res.redirect('/');
	}
}

exports.addCart = function(req,res){
	
	if(req.session.username){
		
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
	var item_code = req.param("item");
	var quantity = req.param("quantity");
	
	console.log(" in add to cart session desc is ", req.session.item.description);
	
		var post  = {item_code: item_code, quantity: quantity, username: req.session.username};
	
		var table = 'cart';
	
		mysql.insertRecord(function(err,results){
			
			if(err){
				throw err;
			}
			else
			{
				console.log("item added in cart successfully")
				itemAddResponse={"statuscode":200}
				res.send(itemAddResponse);
			} 
		},post,table);
	}
	else
	{
		res.redirect('/');
	}
}

exports.addCartSuccess = function(req,res){
	
	if(req.session.username){
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
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
		
		var deleteQuery = "Delete from cart where cart_id = '"+cart_id+"'";
		
		  mysql.deleteData(function(err,results){
				if(err){
					throw err;
				}
				else{
					deleteResponse={"statuscode":200}
					res.send(deleteResponse)
				}  },deleteQuery);
	}else
	{
		res.redirect('/');
	}
}

exports.proceedtocheck = function(req,res){
	
	var cart;
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		var getCart = "Select cart.*, items.quantity as 'available' from cart inner join items on items.item_code = cart.item_code where username = ('"+req.session.username+"')";
		
		mysql.fetchData(function(err,cartdetails){
			if(err){
				throw err;
			}
			else{	
					cart = cartdetails.length;
					
					var str = JSON.stringify(cartdetails);
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
		},getCart);
		
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
		
			var getQuery = "Select cart.username, cart.cart_id, items.item_code, items.price, items.quantity as 'available', cart.quantity, items.description, items.seller_username, items.image from cart inner join items on cart.item_code = items.item_code where cart.username = '"+req.session.username+"'";
		
			mysql.fetchData(function(err,results){
				if(err){
					throw err;
				}
				else{
					var display;
					
					if(results.length > 0){
						display = 1;
					var str =  JSON.stringify(results);
					cartItems = JSON.parse(str);
					
					for(i in cartItems)
						total = total + (cartItems[i].price * cartItems[i].quantity)
					
				}else{
					display = 0;
				}
					
					ejs.renderFile('./views/cart.ejs', { title: 'My Cart', lastlogin: req.session.lastlogin, display: display, cartItems: cartItems, cart: results.length, user: req.session.firstname, total: total } , function(err, result) {
						if (!err) {
							res.end(result);
						}
						else {
							res.end('An error occurred');
							console.log(err);
						}
					});
				}
			},getQuery);
	}
	else{
			res.redirect('/');
		}
}


exports.sellForm = function(req, res){
	
	if(req.session.username){
		
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');	
		
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
	
	ejs.renderFile('./views/sellForm.ejs', { title: 'Ebay Sell', username: req.session.username, firstname: req.session.firstname  } , function(err, result) {
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
}

exports.addDOB = function(req,res){
	var dob = req.param("dob");
	
	var updateDOB = "Update users set dob = '"+dob+"' where username = '"+req.session.username+"'";
	
	 mysql.updateData(function(err,results){
			if(err){
				throw err;
			}
			else{
				
				dobUpdate = {"statuscode":200};
				res.send(dobUpdate);
				
			}  },updateDOB);
		
}

exports.addLocation = function(req,res){
	var location = req.param("location");
	
	var updateLocation = "Update users set location = '"+location+"' where username = '"+req.session.username+"'";
	
	 mysql.updateData(function(err,results){
			if(err){
				throw err;
			}
			else{
				
				dobUpdate = {"statuscode":200};
				res.send(dobUpdate);
				
			}  },updateLocation);
		
}

exports.addGender = function(req,res){
	var gender = req.param("gender");
	
	var updateGender = "Update users set gender = '"+gender+"' where username = '"+req.session.username+"'";
	
	 mysql.updateData(function(err,results){
			if(err){
				throw err;
			}
			else{
				
				dobUpdate = {"statuscode":200};
				res.send(dobUpdate);
				
			}  },updateGender);
		
}

exports.getAccountDetails = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		var getCart = "Select * from cart where username = ('"+req.session.username+"')";
		
		mysql.fetchData(function(err,cartdetails){
			if(err){
				throw err;
			}
			else{	
					cart = cartdetails.length;
					
					var getUser = "Select * from users where username = '"+req.session.username+"'";
					
					mysql.fetchData(function(err, userdetails){
						if(err){
							throw err;
						}
						else{	
							
							var str = JSON.stringify(userdetails[0]);
							var userinfo = JSON.parse(str);
							
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
					},getUser);
			}
		},getCart);
		
	}else{
		res.redirect('/');
	}
	
}

exports.checkout = function(req,res){
	if(req.session.username)
	{
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		console.log("checkout for ",req.session.username)
		
		var getCart = "select cart.*, items.seller_username, items.price from cart inner join items on cart.item_code = items.item_code where cart.username = '"+req.session.username+"'";
		var products;
		var totalPriceBuyer = 0;
		
		mysql.fetchData(function(err,results){
			if(err){
				throw err;
			}
			else{
				if(results.length > 0){
					var str = JSON.stringify(results);
					products =  JSON.parse(str);
		
					var totalCartItems = results.length;
					var quantitiesUpdate = [];
				//	var count = 1;
					
					//fetch quantities to be updated and get total price to be deducted from buyer
					for(i in products){
						totalPriceBuyer = totalPriceBuyer + (products[i].price * products[i].quantity)
						json = {"item_code":products[i].item_code, "quantity": products[i].quantity}
						quantitiesUpdate.push(json);
					}
						
					var sellers = [];
					
					for(i in products)
					{
						var amt = products[i].price * products[i].quantity;
						console.log("i is "+i+" amount is "+amt);
						console.log(" seller is ", products[i].seller_username)
						var exists = 0; var index;
						for(x in sellers)
						{
							if(sellers[x].seller == products[i].seller_username)
							{	
								console.log("already exists")
								exists = 1;
								index = x;
							}
						}
						
						if(exists)
						{
							sellers[index].amount = sellers[index].amount + amt;
						}
						else
						{
							var json = { "seller" : products[i].seller_username, "amount" : amt}
							sellers.push(json)
						}
					}	
					
					//get order id to insert
					var orderid;
					var getMaxOrder = "select max(order_id) as order_id from orders";
					mysql.fetchData(function(err,results){
						if(err){
							throw err;
						}
						else{
							console.log("max order id")
							console.log(results);
							
							if(results[0].order_id == null)
								orderid = 0;
							else
								orderid = (results[0].order_id) + 1;
							
							var currentDate = new Date();
						
							
							for(i in products){
							var post  = {order_id: orderid, item_code: products[i].item_code, quantity: products[i].quantity, price: products[i].price, seller_username: products[i].seller_username, buyer_username: products[i].username, orderdate: currentDate};
									var table = 'orders';
									
									mysql.insertRecord(function(err,results){
										
										if(err){
											throw err;
										}
										else
										{
										
											//update quantities in items table
											for(item in quantitiesUpdate){
												var updateQuantity = "Update items set quantity = quantity - "+quantitiesUpdate[item].quantity+" where item_code = "+quantitiesUpdate[item].item_code;
												
												 mysql.updateData(function(err,results){
														if(err){
															throw err;
														}
														else{
															
														}  },updateQuantity);
												
											}
											
												//update buyers account
										var updateQuerybuyer = "Update users set account = account - "+totalPriceBuyer+" where username = '"+req.session.username+"'";

												 mysql.updateData(function(err,results){
														if(err){
															throw err;
														}
														else{
															
														}  },updateQuerybuyer);
												 
												 
											//update sellers accounts
												 for(x in sellers)
													{
													 	var updateQueryseller = "Update users set account = account + "+sellers[x].amount+" where username = '"+sellers[x].seller+"'";
													 	
													 	mysql.updateData(function(err,results){
													 		
														if(err){
															throw err;
														}
														else{
															
														}  },updateQueryseller); 
												 
													} 
												
												//delete from cart
												var deleteQuery = "Delete from cart where username = '"+req.session.username+"'";
												
												  mysql.deleteData(function(err,results){
														if(err){
															throw err;
														}
														else{
														
															
														}  },deleteQuery);
									
										} 
									},post,table);
							
									}
						
						}
					},getMaxOrder);
			
					}
				else {
						console.log("No products");

					}   }  },getCart);
	}
	else
	{
		res.redirect('/');
	}
};

exports.viewItem = function(req,res){
	
	if(req.session.username){
		
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		var item = req.param("item");
		var currentItem;
		var getItem =  "select * from items where item_code="+item;
		
		mysql.fetchData(function(err,results){
			if(err){
				throw err;
			}
			else{
				if(results.length > 0){	
					currentItem = results[0];
					req.session.item = currentItem;
					itemResponse={"item":currentItem, "statuscode":200}
					res.send(itemResponse);
				}	
			}
		}, getItem);
	}
	else
	{
		res.redirect('/');
	}
}

exports.viewItemDetails = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
				
		var getCart = "Select * from cart where username = ('"+req.session.username+"')";
		
		mysql.fetchData(function(err,cartdetails){
			if(err){
				throw err;
			}
			else{
					cart = cartdetails.length;
					
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
					
					//to check if the item is already in user cart
					var cartUserCombo = "Select * from cart where username = '"+req.session.username+"' and item_code = "+req.session.item.item_code;
					
					mysql.fetchData(function(err,results){
						if(err){
							throw err;
						}
						else{
							
							if(results.length > 0)
								{
									displayCart = 0;
								}
								else{
									displayCart = 1;
								}
							
							var getBids = "Select bidding.*, items.price from bidding inner join items on items.item_code = bidding.item_code where bidding.item_code="+req.session.item.item_code;
							var bidCount;
							
							mysql.fetchData(function(err,results){
								if(err){
									throw err;
								}
								else{
									var maxBid = 0
									
									if(results.length > 0)
									{
										
										bidCount = results.length;
										
										for(i in results)
										{
											if(results[i].bid_amount > maxBid)
												maxBid = results[i].bid_amount;
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
										
									ejs.renderFile('./views/itemDetails.ejs', { title: 'View Item', days: days, hours: hours, item: req.session.item, username: req.session.username, firstname: req.session.firstname, cart: cart, condition: condition, displayCart: displayCart, bids: bidCount, maxBid: maxBid  } , function(err, result) {
										if (!err) {	
											res.end(result);
										}else {
											res.end('An error occurred');
											console.log(err);
										}
									});	
								}
							}, getBids);
						}
					},cartUserCombo);
				}
		},getCart);
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
		
		var getCart = "Select * from cart where username = ('"+req.session.username+"')";
		
		mysql.fetchData(function(err,cartDetails){
			if(err){
				throw err;
			}
			else{
				cart = cartDetails.length;
				
				var bidQuery = "Select * from bidding where item_code="+req.session.item.item_code+" order by bid_amount desc";
				
				mysql.fetchData(function(err,results){
					if(err){
						throw err;
					}
					else{
						var str = JSON.stringify(results);
						
						var bids = JSON.parse(str);
						
					/**	var maxBid = 0;
						
						for(i in bids)
						{
							if(bids[i].bid_amount > maxBid)
								maxBid = bids[i].bid_amount;
						} **/
						
						console.log("Bids are: ")
						for(i in bids){
							console.log(bids[i].bid_amount);
							var day=dateformat(bids[i].bid_time, "yyyy-mm-dd HH:MM:ss");
							bids[i].bid_time = day;
						}
						
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
				}, bidQuery);
				
			}
		}, getCart);
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
	
			var getMaxBid = "Select max(bid_amount) as bid from bidding where item_code = "+req.session.item.item_code;
			
			mysql.fetchData(function(err,maxBidDetails){
				if(err){
					throw err;
				}
				else{
					if(bid > maxBidDetails[0].bid && bid > req.session.item.price){
						
						var currentTime = new Date();
						
						var post  = {bid_amount: bid, bid_username: req.session.username, item_code: req.session.item.item_code, bid_time: currentTime };
						var table = 'bidding';
						
						mysql.insertRecord(function(err,results){
							if(err){
								throw err;
							}
							else
							{
								console.log("bid added successfully ");
								
								bidResponse={"statuscode":200}
								res.send(bidResponse);
							} 
						},post,table); 
					}else{
						bidResponse={"statuscode":201}
						res.send(bidResponse);
					}
				}},getMaxBid);
			
	}else{
		res.redirect('/');
	}
		
}

exports.signupsuccessredirect = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
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
	
	
	var insert_check = false;
	
	if(email != email2)
	{
		console.log("emails not equal");
		signupResponse={"statuscode": 300}
		res.send(signupResponse);
	}
	else
	{
		var checkEmail = "select * from users where email='"+email+"'";
		
	  mysql.fetchData(function(err,results){
			if(err){
				throw err;
			}
			else{
				if(results.length > 0){	
					console.log("email exists");
					signupResponse={"statuscode":401}
					res.send(signupResponse);
				}
				else
				{		
					username = (firstname.toLowerCase().substring(0,4)) + (lastname.toLowerCase().substring(0,5));
					var checkUsername =  "select * from users where username='"+username+"'";
					
					mysql.fetchData(function(err,results){
						if(err){
							throw err;
						}
						else{
							if(results.length > 0){	
								console.log("username exists");
								username = username + Math.floor((Math.random() * 100) + 1);
							}
							
								password = encrypt(password);
								
								var current = new Date();
								var newLogin = dateformat(current, "yyyy-mm-dd HH:MM:ss");
								
								var post  = {firstname: firstname, lastname: lastname, password: password, email: email, mobile: mobile, username:username, last_login: newLogin };
								var table = 'users';
								
								mysql.insertRecord(function(err,results){
									
									if(err){
										throw err;
									}
									else
									{
										console.log("user added successfully ",username)
										
										req.session.destroy();
										
										req.session.username = username;
										req.session.firstname = firstname;
										
										console.log(" In signup")
										console.log("session username ", req.session.username)
										console.log("session firstname ", req.session.firstname)
										
										signupResponse={"statuscode":200, "username":username}
										res.send(signupResponse);
									} 
								},post,table);
						}
					}, checkUsername);
				}
			}  },checkEmail);
	}
};


exports.getSummary = function(req,res){
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	var getCart = "Select * from cart where username = ('"+req.session.username+"')";
	var cart;
	mysql.fetchData(function(err,cartdetails){
		if(err){
			throw err;
		}
		else{	
				cart = cartdetails.length;
				
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
		},getCart);
	}else{
		res.redirect('/');
	}	
};

exports.getSummaryOrders = function(req,res){
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	var getCart = "Select * from cart where username = ('"+req.session.username+"')";
	var cart;
	mysql.fetchData(function(err,cartdetails){
		if(err){
			throw err;
		}
		else{	
			cart = cartdetails.length;
			
			var getOrders = "Select orders.*, items.description,items.item_type,items.seller_username,items.image, items.bid_endtime from orders inner join items on items.item_code = orders.item_code where orders.buyer_username = ('"+req.session.username+"')";
			
			mysql.fetchData(function(err,orderdetails){
				if(err){
					throw err;
				}
				else{
					var display = 0;
					if(orderdetails.length > 0){
						display = 1;
						var str = JSON.stringify(orderdetails);
						var orders = JSON.parse(str);
						
						for(i in orders){
							var day=dateformat(orders[i].orderdate, "yyyy-mm-dd hh:MM:ss");
							orders[i].orderdate =  day;
						}
					}else{
						display = 0;
					}
					
					ejs.renderFile('./views/summaryOrders.ejs', { title: 'Summary', display: display, username: req.session.username, user: req.session.firstname, cart: cart, orders: orders, lastlogin: req.session.lastlogin  } , function(err, result) {
						if (!err) {
							res.end(result);
						}
						else {
							res.end('An error occurred');
							console.log(err);
						}
					});
				}
			},getOrders);
		}
	},getCart);
	}else{
		res.redirect('/');
	}
		
};

exports.getSummarySold = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		var getCart = "Select * from cart where username = ('"+req.session.username+"')";
		var cart;
		mysql.fetchData(function(err,cartdetails){
			if(err){
				throw err;
			}
			else{	
					cart = cartdetails.length;
					
					var getSold = "Select orders.*, items.image, items.quantity as 'available', items.item_type, items.description, items.price as 'itemprice', items.insert_time from orders inner join items on items.item_code = orders.item_code where orders.seller_username = '"+req.session.username+"'";
					
					mysql.fetchData(function(err,soldDetails){
						if(err){
							throw err;
						}
						else{
							var display = 0;
							if(soldDetails.length > 0){
								display = 1;
								var str = JSON.stringify(soldDetails);
								var sold = JSON.parse(str);
								
								for(i in sold){
									var order=dateformat(sold[i].orderdate, "yyyy-mm-dd hh:MM:ss");
									sold[i].orderdate =  order;
									
									var insert=dateformat(sold[i].insert_time, "yyyy-mm-dd hh:MM:ss");
									sold[i].insert_time =  insert;
									
									var bidend=dateformat(sold[i].bid_endtime, "yyyy-mm-dd hh:MM:ss");
									sold[i].bid_endtime =  bidend;
								}
							}else{
								display = 0;
							}
						
							ejs.renderFile('./views/summarySold.ejs', { title: 'Summary', display: display, username: req.session.username, user: req.session.firstname, lastlogin: req.session.lastlogin, cart: cart, sold: sold  } , function(err, result) {
								if (!err) {
									res.end(result);
								}
								else {
									res.end('An error occurred');
									console.log(err);
								}
							});
						}
					},getSold);
			}
		},getCart);
	}else{
		res.redirect('/');
	}
}

exports.getSummaryActive = function(req,res){
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		var getCart = "Select * from cart where username = ('"+req.session.username+"')";
		var cart;
		mysql.fetchData(function(err,cartdetails){
			if(err){
				throw err;
			}
			else{	
					cart = cartdetails.length;
					
					var getActive = "Select * from items where seller_username = '"+req.session.username+"' and quantity > 0";
					
					mysql.fetchData(function(err,activeDetails){
						if(err){
							throw err;
						}
						else{
							var display;
							
							if(activeDetails.length > 0){
								display = 1;
								var str = JSON.stringify(activeDetails);
								var active = JSON.parse(str);
								
								for(i in active){
									var insert=dateformat(active[i].insert_time, "yyyy-mm-dd hh:MM:ss");
									if(active[i].bid=='1'){
										var bidend=dateformat(active[i].bid_endtime, "yyyy-mm-dd hh:MM:ss");
										active[i].bid_endtime =  bidend;
									}
									active[i].insert_time =  insert;
								}
							}else{
								display = 0;
							}
						
							console.log("value of display in active is ",display)
							
							ejs.renderFile('./views/summaryActive.ejs', { title: 'Summary', display: display, username: req.session.username, user: req.session.firstname, lastlogin: req.session.lastlogin, cart: cart, active: active  } , function(err, result) {
								if (!err) {
									res.end(result);
								}
								else {
									res.end('An error occurred');
									console.log(err);
								}
							});
							
							
						}
					},getActive);
					
			}
		},getCart);
		
		
	}else{
		res.redirect('/');
	}
}

exports.getSummaryBids = function(req,res){
	
	if(req.session.username){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	var getCart = "Select * from cart where username = ('"+req.session.username+"')";
	var cart;
	mysql.fetchData(function(err,cartdetails){
		if(err){
			throw err;
		}
		else{	
				cart = cartdetails.length;
				
				var getBids = "Select bidding.*, items.description,items.item_type,items.price,items.seller_username,items.image, items.bid_endtime from bidding inner join items on items.item_code = bidding.item_code where bidding.bid_username = ('"+req.session.username+"')";
				
				mysql.fetchData(function(err,bidDetails){
					if(err){
						throw err;
					}
					else{
						var display = 0;
						if(bidDetails.length > 0){
							display = 1;
							var str = JSON.stringify(bidDetails);
							var bids = JSON.parse(str);
							
							for(i in bids){
								var day=dateformat(bids[i].bid_time, "yyyy-mm-dd hh:MM:ss");
								bids[i].bid_time =  day;
							}
							
							for(x in bids){
								var day=dateformat(bids[x].bid_endtime, "yyyy-mm-dd hh:MM:ss");
								bids[x].bid_endtime =  day;
							}
						}else{
							display = 0;
						}
						
						ejs.renderFile('./views/summaryBids.ejs', { title: 'Summary', display: display, username: req.session.username, user: req.session.firstname, cart: cart, bids: bids  } , function(err, result) {
							if (!err) {
								res.end(result);
							}
							else {
								res.end('An error occurred');
								console.log(err);
							}
						});
						
					}
				}, getBids);
				
		}
	},getCart);	
	}else{
		res.redirect('/');
	}
}


exports.logout = function(req,res){
	
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
