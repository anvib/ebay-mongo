var ejs = require('ejs');
var mysql = require('mysql');

var poolSize = 50;
var pool =[];

//connection pool

function getConnection(){
	var connection = mysql.createConnection({
		host : 'localhost',
		user : 'root',
		password : 'Dolly90#',
		database : 'ebay',
		port : 3306
	});
	return connection;
}

exports.createConnectionPool= function createConnectionPool(){
	console.log("creating connections ")
	for(var i=0; i<poolSize; i++){
		pool.push(getConnection());
	}
}

function getPoolConnection(){
	console.log("getting connection ")
	if(pool.length<=0){
		console.log("No connections to fetch");
		return null;
	}
	else{
		return pool.pop();
	}
	
}

function insertRecord(callback, post, table){
	//console.log("Data to insert is : "+post);
	
	var connection=getPoolConnection();
	
	connection.query('INSERT INTO '+table+' SET ?', post, function(err, result){
		if(err)
		{
			console.log("Error : "+err.message);
		}
		else
		{
			callback(err,result);
		}
			
	});
	console.log("SQL connection ended");
	connection.end();	
}

function fetchData(callback, sqlQuery){
	
	console.log("Query to fetch : "+sqlQuery)
	
	var connection=getPoolConnection();
	
	//var connection = getConnection();
	
	connection.query(sqlQuery, function(err,rows,fields){
		if(err)
		{
			console.log("Error : "+err.message);
		}
		else
		{
			callback(err,rows);
		}
	});
	console.log("SQL connection ended");
	connection.end();
}

function deleteData(callback, sqlQuery){
	
	console.log("Query to delete : "+sqlQuery)
	
	var connection=getPoolConnection();
	
	//var connection = getConnection();
	
	connection.query(sqlQuery, function(err,rows,fields){
		if(err)
		{
			console.log("Error : "+err.message);
		}
		else
		{
			callback(err,rows);
		}
	});
	console.log("SQL connection ended");
	connection.end();
}

function updateData(callback, sqlQuery){
	
	console.log("Query to update : "+sqlQuery)
	
	var connection=getPoolConnection();
	
	//var connection = getConnection();
	
	connection.query(sqlQuery, function(err,rows,fields){
		if(err)
		{
			console.log("Error : "+err.message);
		}
		else
		{
			callback(err,rows);
		}
	});
	console.log("SQL connection ended");
	connection.end();
}

exports.insertRecord = insertRecord;
exports.fetchData = fetchData;
exports.deleteData = deleteData;
exports.updateData = updateData;