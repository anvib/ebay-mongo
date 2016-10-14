var ejs = require('ejs');
var mysql = require('mysql');

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

function insertRecord(callback, post, table){
	//console.log("Data to insert is : "+post);
	
	var connection = getConnection();
	
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
	
	var connection = getConnection();
	
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
	
	var connection = getConnection();
	
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
	
	var connection = getConnection();
	
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