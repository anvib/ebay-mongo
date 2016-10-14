var sell = angular.module('sell', ['ngRoute']);

console.log(" in sell angular")

sell.config(['$routeProvider', function($routeProvider) {
	console.log(" in sell angular 1")
    $routeProvider.
    when('/createListing', {
            templateUrl : 'templates/createsell.html',
            controller  : 'createsellController'
        }).
        when('/selltype', {
            templateUrl : 'templates/selltype.html',
            controller  : 'selltypeController'
        }).
        otherwise({
		redirectTo: '/createListing'
      });
	
}]);

        
        sell.controller('createsellController', function($scope) {
            // create a message to display in our view
        	 $scope.message = 'Look! I am in create page.';
        	 console.log("check ngoute 1 success")
        });

        sell.controller('selltypeController', function($scope) {
        	 $scope.message = 'Look! I am an sell type';
        	 console.log("check ngoute 2 success");
        });


        sell.controller('sell',function($scope,$http){

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
        			{
        				window.location.assign("/sellForm");
        			}
        		}).error(function(error){
        			console.log("In angular - error to process request");
        		});
        		
        	}
        })

        
        
