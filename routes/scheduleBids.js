var mysql = require('./mysql');
var winston_logger = require('winston')

exports.bid_job = {
    
    after: {                
        seconds: 0,
        minutes:10,
        hours: 0,
        days: 0
    },
    job: function () {

        
        var findExpireBids = "Select item_code, bid_endtime from items where bid_endtime < now() and bid_status = 0";
       // console.log(findExpireBids);
        
        mysql.fetchData(function(err,expiryBids){
			if(err){
				throw err;
			}
			else{
				if(expiryBids.length > 0)
				{
					var str = JSON.stringify(expiryBids);
					var expiredBids = JSON.parse(str);
					
					winston_logger.log('info', 'Bidding completed for item '+expiredBids[i].item_code);
					
					for(i in expiredBids){
						var getBids = "Select bidding.*, items.seller_username from bidding inner join items on items.item_code = bidding.item_code where bidding.item_code="+expiredBids[i].item_code;
						//console.log(getBids);
						
						 mysql.fetchData(function(err,bids){
								if(err){
									throw err;
								}
								else{
									if(bids.length > 0){
										var bidstr = JSON.stringify(bids);
										var bidscheck = JSON.parse(bidstr);
										
										console.log("bids are");
										var maxBid = 0;
										var winningBidUser = null;
										
										for(j in bids){
											if(bids[j].bid_amount > maxBid){
												maxBid = bids[j].bid_amount;
												winningBidUser = bids[j].bid_username;
											}
										}
										
										var seller = bids[0].seller_username;
										
										var orderid;
										var getMaxOrder = "select max(order_id) as order_id from orders";
										console.log(getMaxOrder)
										
										mysql.fetchData(function(err,maxorders){
											if(err){
												throw err;
											}
											else{
												if(maxorders[0].order_id == null)
													orderid = 0;
												else
													orderid = (maxorders[0].order_id) + 1;
												
												var currentDate = new Date();
												
												var post  = {order_id: orderid, item_code: expiredBids[i].item_code, quantity: 1, seller_username: seller, buyer_username: winningBidUser, orderdate: currentDate, bid: 1, price: maxBid};
												var table = 'orders';
												
												mysql.insertRecord(function(err,results){
													
													if(err){
														throw err;
													}
													else
													{
														console.log("bid order successfull");
														
														//update bidding table to notify that bidding completed
														var updateBidding = "Update bidding set sold = 1 where item_code = "+expiredBids[i].item_code;
													 	console.log(updateBidding)
													 	
													 	mysql.updateData(function(err,results){
													 		
														if(err){
															throw err;
														}
														else{
														}  },updateBidding);
													 	
													 	//update bidding table to notify that bidding completed
														var updateBidding = "Update bidding set sold = 2 where item_code = "+expiredBids[i].item_code+" and bid_amount = "+maxBid;
													 	console.log(updateBidding)
														
													 	mysql.updateData(function(err,results){
													 		
														if(err){
															throw err;
														}
														else{
														}  },updateBidding);
													 	
													 	//update account for buyer
													 	var updateBuyer = "Update users set account = account - "+maxBid+" where username = '"+winningBidUser+"'";
													 	console.log(updateBuyer)
													 	
													 	mysql.updateData(function(err,results){
													 		
														if(err){
															throw err;
														}
														else{
														}  },updateBuyer); 
													 	
													 	//update account for seller
													 	var updateSeller = "Update users set account = account + "+maxBid+" where username = '"+seller+"'";
													 	console.log(updateSeller);
													 	
													 	mysql.updateData(function(err,results){
													 		
														if(err){
															throw err;
														}
														else{
														}  },updateSeller);
													 	
													 	//update bid status in items
													 	var updateItemStatus = "Update items set bid_status = 1 where item_code = "+expiredBids[i].item_code;
													 	console.log(updateItemStatus);
													 	
													 	mysql.updateData(function(err,results){
													 		
														if(err){
															throw err;
														}
														else{
														}  },updateItemStatus);
													 		
													} 
													
											},post,table);
											}
										},getMaxOrder);
										
									}else{
										console.log("no bids on expired auction")
									}
								}
						 },getBids);
					}
				}
			}
        }, findExpireBids); 
    },
    spawn: true             
}
 