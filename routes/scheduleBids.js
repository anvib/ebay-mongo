var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/ebay";

var dateformat = require('dateformat');

var winston_logger = require('winston')

exports.bid_job = {
    
    after: {                
        seconds: 0,
        minutes:10,
        hours: 0,
        days: 0
    },
    job: function () {

		console.log("checking bids")

		mongo.connect(mongoURL, function() {

			var coll_items = mongo.collection('items');
			var coll_users = mongo.collection('users');

			var currentDate = new Date();
			var checkDate = dateformat(currentDate,"yyyy-mm-dd HH:MM:ss");

			coll_items.find( { $and: [ { bid_status: 0  } ,{bid_endtime:  { $lt: checkDate }}]  }).toArray(function(err, items) {

					if(items.length > 0){

						winston_logger.log('info', 'Bidding completed for items '+items.length);

						for(i in items){
							if(items[i].bids.length > 0){

								var maxBid = 0;
								var winningBidUser = null;

								var bids = items[i].bids;
								for(j in bids){
									if(Number(bids[j].bid_amount) > Number(maxBid)){
										maxBid = Number(bids[j].bid_amount);
										winningBidUser = bids[j].bid_username;
									}
								}

								var seller = items[0].seller_username;
								var item_code = items[0].item_code;

								coll_users.find({username:seller}).toArray(function(err, results) {

									//get order id to insert
									var user = results[0];
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
									var orders = [];

									for(x in user.orders){
										orders.push(user.orders[x])
									}

									json = {
										"orderid":orderid,
										"item_code":item_code,
										"orderdate":orderdate,
										"seller_username":seller,
										"buyer_username":winningBidUser,
										"quantity":1,
										"bid":1,
										"price":maxBid
									}

									orders.push(json);

									coll_users.update(
										{
											username: winningBidUser
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

									//update biddetails in item
									console.log("bids update")
									console.log(bids)
									for(i in bids){
										if(Number(bids[i].bid_amount) == Number(maxBid)){
											bids[i].sold = 2;
										}else{
											bids[i].sold = 1;
										}
									}

									console.log("new bids")
									console.log(bids)

									coll_items.update(
										{
											item_code: item_code
										},
										{
											$set: {
												bids : bids
											}
										}), function(err, user){
										if(err) {
											throw err;
										} else {
											//new order placed successfully
											console.log("new order added")
										}
									};

									//update account for buyer
									coll_users.update(
										{
											username: winningBidUser
										},
										{
											$inc: {
												account : Number(0) - Number(maxBid)
											}
										})

									console.log("buyer account updated")

									//update account for seller
									coll_users.update(
										{
											username: seller
										},
										{
											$inc: {
												account : Number(maxBid)
											}
										})

									console.log("seller account updated")

									//update bid status in items
									coll_items.update(
										{
											item_code: item_code
										},
										{
											$inc: {
												bid_status: 1
											}
										})

									console.log("bid status updated")














								});


							}
						}


					}else{

					}
				});

		});

    },
    spawn: true             
}
 