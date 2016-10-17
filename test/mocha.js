
var request = require('request');
var express = require('express');
var assert = require("assert");
var http = require("http");

describe('http tests', function(){

	it('Test - Login page', function(done){
		http.get('http://localhost:3000/', function(res) {
			assert.equal(200, res.statusCode);
			done();
		})
	});
	
	it('Test - Add a new item', function(done) {
		request.post(
			    'http://localhost:3000/sellItem',
			    { form: { operation: "sellItemDetails", item_type:"Laptop", description:"Lenovo G50 series", details: "Lenovo G50 series new without box", bid: 0, condition_prod:0, seller_username: 'ajaychhab', seller_state: 'CA', price: '25', quantity: "3", insert_time: new Date(), bid_endTime: new Date() } },
			    function (error, response, body) {
			    	assert.equal(302, response.statusCode);
			    	done();
			    }
			);
	  });
	
	it('Test - render cart page', function(done) {
		http.get('http://localhost:3000/cart', function(res) {
			assert.equal(302, res.statusCode);
			done();
		});
	  });
	
	it('Test - submit credit card details', function(done) {
		request.post(
			    'http://localhost:3000/takePayment',
			    { form: { operation: "takePayment", ccnumber:"1234123412341234", firstname: "Anvita", lastname: "Bathija", cvv: "123" } },
			    function (error, response, body) {
			    	assert.equal(302, response.statusCode);
			    	done();
			    }
			);
	  });
	
	it('Test - signin', function(done) {
		request.post(
			    'http://localhost:3000/submitLogin',
			    { form: { operation: "loginCheck", username:"anvibathi", password:"Anvi90#" } },
			    function (error, response, body) {
			    	assert.equal(302, response.statuscode);
			    	done();
			    }
			);
	  });
	
	
	

	
	
});