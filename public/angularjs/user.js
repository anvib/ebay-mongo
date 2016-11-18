var user = angular.module('user',[]);

console.log("I am in angular");

user.controller('signin',function($scope,$http){
	
	console.log("In angular signin controller");

	$scope.login = false;
	$scope.btn_signin=function(){
		$http({
			method: "POST",
			url: '/submitLogin',
			data:{
				"username" : $scope.username,
				"password" : $scope.password
			}
		}).success(function(data){
			if(data.statuscode==401){
				console.log("In angular: No such user");
				$scope.login = true;
			}else if(data.statuscode==200){
				window.location.assign("/homepage");
				//window.location.assign("/trial");
				console.log("In angular: User found");
			}else{
				console.log("In angular: unknown case")
			}
			
		}).error(function(error){
			console.log("In angular: error to sign in");
		});
		
	};
	
	$scope.btn_uname_contd=function(){
		console.log("in angular success for contd")
		
		window.location.assign("/homepage");
	};
	
	$scope.addDOB = function(req,res){
		
		$http({
			method: "POST",
			url: '/addDOB',
			data:{
				"dob" : $scope.dob
			}
		}).success(function(data){
			if(data.statuscode==200){
				window.location.assign("/myAccount");
			}
		}).error(function(error){
			console.log("In angular: error to update DOB");
		});
		
	};
	
$scope.addGender = function(req,res){
		
		$http({
			method: "POST",
			url: '/addGender',
			data:{
				"gender" : $scope.gender
			}
		}).success(function(data){
			if(data.statuscode==200){
				window.location.assign("/myAccount");
			}
		}).error(function(error){
			console.log("In angular: error to update gender");
		});
		
	};
	
	
$scope.addLocation = function(req,res){
		
		$http({
			method: "POST",
			url: '/addLocation',
			data:{
				"location" : $scope.location
			}
		}).success(function(data){
			if(data.statuscode==200){
				window.location.assign("/myAccount");
			}
		}).error(function(error){
			console.log("In angular: error to update location");
		});
		
	};
})

user.controller('cart',function($scope,$http){
	
	$scope.lowbid = false;
	$scope.bidSuccess = false;
	
	$scope.viewItem=function(data){
		$scope.item_code = data;
		console.log("open item "+$scope.item_code)
		$http({
			method: "POST",
			url: '/itemDetails',
			data:{
				"item" : $scope.item_code
			}
		}).success(function(data){
			if(data.statuscode==200)
			{
				window.location.assign("/itemDetails");
			}	
		}).error(function(error){
			console.log("In angular - error to process item view");
		});
	}
	
	$scope.viewBids=function(data){
		$http({
			method: "POST",
			url: '/bidDetails'
		}).success(function(data){
			if(data.statuscode==200)
			{
				window.location.assign("/bidDetails")
			}
		}).error(function(error){
			console.log("In angular - error to process bid details");
		});
	}
	
	$scope.closeModal = function(data){
		window.location.assign("/itemDetails");
	}
	
	$scope.addBid=function(data){
		
		$http({
			method: "POST",
			url: '/addBid',
			data:{
				"bid" : $scope.bidPrice
			}
		}).success(function(data){
			if(data.statuscode == 200){
				$scope.lowbid = false;
				$scope.bidSuccess = true;
			}else if(data.statuscode == 201){
				$scope.lowbid = true;
				$scope.bidSuccess = false;
			}
		}).error(function(error){
			console.log("In angular -  error to add bid");
		});
	}


	$scope.addCart=function(data){
		 $scope.item_code = data;
		console.log("quantity is "+$scope.quantity)
		$http({
			method: "POST",
			url: '/addcart',
			data:{
				"item" : $scope.item_code,
				"quantity" : $scope.quantity
			}
		}).success(function(data){
			if(data.statuscode==200)
				window.location.assign("/addCartSuccess");
			
		}).error(function(error){
			console.log("In angular - error to process request");
		});
		
	}
	
	$scope.updateCartQty=function(data){
		console.log("reached here to update cart for ",data);
		console.log("new qty is ",$scope.newqty);
		
		$http({
			method: "POST",
			url: '/updateCart',
			data:{
				"item_code" : data,
				"new_qty" : $scope.newqty
			}
		}).success(function(data){
			if(data.statuscode==200)
			{	console.log("successfully updated")
				window.location.assign("/cart");
			}
		}).error(function(error){
			console.log("In angular - error to process request");
		});
	}
	
	$scope.removeCart=function(data){
		console.log("data received from cart ejs to remove is "+data)
		$scope.cart_item = data;
		console.log("Cart item to be deleted is ",$scope.cart_item)
		
		$http({
			method: "POST",
			url: '/removeCart',
			data:{
				"cart_id" : data
			}
		}).success(function(data){
			if(data.statuscode==200)
			{	console.log("successfully deleted")
				window.location.assign("/cart");
			}
		}).error(function(error){
			console.log("In angular - error to process request");
		});
	}
	
	$scope.available = false;
	
	$scope.proceedCheck = function(){
		$http({
			method: "POST",
			url: '/proceedCheck'
		}).success(function(data){
			if(data.statuscode==200){
				window.location.assign("/creditcardvalidation");
				console.log("good to proceed")
			}else if(data.statuscode==201){
				console.log("cannot proceed")
				$scope.available = true;
			}
		}).error(function(error){
			console.log("In angular - error to process request");
		});
	}
})

user.controller('sell',function($scope,$http){

	console.log("In angular sell controller");
	
	$scope.btn_sell=function(){
		
		localStorage.setItem('type',$scope.item_type);
	    console.log("just to check");
	    console.log(localStorage.getItem('type'));
		$http({
			method: "POST",
			url: '/selltype',
			data:{
				"type" : $scope.item_type
			}
		}).success(function(data){
			if(data.statuscode==200)
				window.location.assign("/sellForm");
			
		}).error(function(error){
			console.log("In angular - error to process request");
		});
		
	}
})


user.controller('sellForm',function($scope,$http){
	$scope.item_type = localStorage.getItem('type');
	
	$scope.auction = false;
	$scope.fixed = false;
	
	$scope.condition = {
			options:[
			{id: '0', name: 'New with box'},
			{id: '1', name: 'New without box'},
			{id: '2', name: 'Used'},
			{id: '3', name: 'Some parts not functioning'}
			],
			selectedCondition:{id: '0', name: 'New with box'}
		};
	
	
	$scope.pricetype=function(data){
			
		var priceType = data;
		console.log("price type selected is ",priceType);
		
		if(priceType == 'auction')
		{
			localStorage.setItem('sell_type','auction');
			$scope.auction = true;
			$scope.fixed = false;
		}
		else{
			localStorage.setItem('sell_type','fixed');
			$scope.fixed = true;
			$scope.auction = false;
		}
	}
	
	$scope.warn = false;
	
	
	$scope.btn_sellItem=function(){
		
		if(item_type == null && sell_type == null && $scope.fixed_quantity == null && $scope.seller_state == null){
			$scope.warn = true;
		}else{
		
		var item_type = localStorage.getItem('type');
		var sell_type = localStorage.getItem('sell_type');
		var price;
		var quantity;
		var bid;
		
		console.log("item type is ",item_type);
		
		console.log("sell type is ",sell_type);
		
		if(sell_type == 'auction'){
			price = $scope.auc_start_price;
			quantity = 1;
			bid = 1;
			
		}else if(sell_type == 'fixed'){
			price = $scope.fixed_price;
			quantity = $scope.fixed_quantity;
			bid = 0;
		}
		
		$http({
			method: "POST",
			url: '/sellItem',
			data:{
				"type" : item_type,
				"title" : $scope.item_type,
				"condition" : $scope.condition.selectedCondition.id,
				"details" : $scope.details,
				"quantity" : quantity,
				"price" : price,
				"bid" : bid,
				"seller_state" : $scope.seller_state
			}
		}).success(function(data){
			if(data.statuscode==200)
			{
				console.log("here in success of sell item");
				window.location.assign("/newItemSuccess");
			}
			
		}).error(function(error){
			console.log("In angular - error to process request");
		});	
	}
	}
})


user.controller('payment',function($scope,$http){

	console.log("In angular payment controller");
	
	$scope.month = {
			options:[
			{id: 'm01', name: 'Jan'},
			{id: 'm02', name: 'Feb'},
			{id: 'm03', name: 'Mar'},
			{id: 'm04', name: 'Apr'},
			{id: 'm05', name: 'May'},
			{id: 'm06', name: 'Jun'},
			{id: 'm07', name: 'Jul'},
			{id: 'm08', name: 'Aug'},
			{id: 'm09', name: 'Sep'},
			{id: 'm10', name: 'Oct'},
			{id: 'm11', name: 'Nov'},
			{id: 'm12', name: 'Dec'}
			],
			selectedMonth:{id: 'm01', name: 'Jan'}
		};
	
	$scope.year = {
			options:[
			{id: 'y2000', name: '2020'},
			{id: 'y2000', name: '2000'},
			{id: 'y1999', name: '1999'},
			{id: 'y1998', name: '1998'},
			{id: 'y1997', name: '1997'},
			{id: 'y1996', name: '1996'},
			{id: 'y1995', name: '1995'},
			{id: 'y1994', name: '1994'},
			{id: 'y1993', name: '1993'},
			{id: 'y1992', name: '1992'},
			{id: 'y1991', name: '1991'},
			{id: 'y1990', name: '1990'},
			{id: 'y1989', name: '1989'},
			{id: 'y1988', name: '1988'},
			{id: 'y1987', name: '1987'},
			{id: 'y1986', name: '1986'},
			{id: 'y1985', name: '1985'}
			],
			selectedYear:{id: 'y1990', name: '1990'}
		};
	
	$scope.btn_checkout=function(){
		
		var expiryMon = $scope.month.selectedMonth.name;
		var expiryYear = $scope.year.selectedYear.name;
	
		var expiry = expiryMon +"/"+ expiryYear;
	
		var ccnumber = $scope.ccnumber;
		if(typeof ccnumber == 'undefined')
			ccnumber = 0;
		
		var cvv = $scope.cvv;
		if(typeof cvv == 'undefined')
			cvv = 0;
		
		var firstname = $scope.firstname;
		if(typeof firstname == 'undefined')
			firstname = null;
				
		var lastname = $scope.lastname;
		if(typeof lastname == 'undefined')
			lastname = null;
		
		$http({
			method: "POST",
			url: '/takePayment',
			data:{
				"ccnumber" : ccnumber,
				"firstname" : firstname,
				"lastname" : lastname,
				"cvv" : cvv,
				"expiry" : expiry
			}
		}).success(function(data){
			if(data.statuscode==200)
			{
				console.log("I am here in angular true");
				window.location.assign("/checkout");
			}
			else
			{
				console.log("I am here in angular false");
				window.location.assign("/paymentFailure");
			}
		}).error(function(error){
			console.log("In angular - error to process request");
		});
		
		
	}
	
});


user.controller('signup',function($scope,$http){

	console.log("In angular signup controller");

	
	$scope.emailmatch = false;
	$scope.enterpass = false;
	$scope.email1error = false;
	$scope.reemailerror = false;
	$scope.firstnameerror = false;
	$scope.lastnameerror = false;
	
	$scope.btn_signup=function(){
		
		
		var firstname = $scope.firstname;
		var lastname = $scope.lastname;
		var password = $scope.password;
		var mobile = $scope.mobile;
		var email1 = $scope.email;
		var email2 = $scope.email2;
		
		if($scope.firstname == null && $scope.lastname == null && $scope.password == null && $scope.mobile == null && $scope.email == null && $scope.email2 == null)
		{
			$scope.enterpass = true;
			$scope.email1error = true;
			$scope.reemailerror = true;
			$scope.firstnameerror = true;
			$scope.lastnameerror = true;
		}else{

			if(email1 != email2)
				$scope.emailmatch = true;
			else
				$scope.emailmatch = false;
			
			if(password == null)
				$scope.enterpassword = true;
			else
				$scope.enterpassword = false;
			
			$scope.enterpassword = function(){
				$scope.enterpass = true;
				$scope.passrules = true;
			}
			
			$http({
				method: "POST",
				url: '/submitSignUp',
				data:{
					"firstname" : $scope.firstname,
					"lastname" : $scope.lastname,
					"password" : $scope.password,
					"email" : $scope.email,
					"email2" : $scope.email2,
					"mobile" : $scope.mobile
				}
			}).success(function(data){
				if(data.statuscode == 200)
				{
					$scope.emailmatch = false;
					console.log(" I am here in angular success and username is",data.username);
					window.location.assign("/signupsuccess");
				}
				else if(data.statuscode == 300)
				{
					$scope.emailmatch = true;
				}else if(data.statuscode == 401){
					$scope.emailexists = true;
				}
				else
				{
					$scope.emailmatch = false;
				}
			}).error(function(error){
				console.log("In angular - error to add user");
			});
		}
		
	
	}
})