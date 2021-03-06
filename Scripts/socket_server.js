var http = require('http');
var io = require('socket.io');
var port = 8080;

// Start the server at port 8080
var server = http.createServer(function(req, res){ 
    // Send HTML headers and message
    res.writeHead(200,{ 'Content-Type': 'text/html' }); 
    res.end('<h1>Hello Socket Lover!</h1>');
});

server.listen(port)
// Create a Socket.IO instance, passing it our server
var socket = io.listen(server);

// Add a connect listener
socket.on('connection', function(client){ 
    console.log('Connection to client established');

    client.on('message',function(event){ 

    var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    assert = require('assert');

	var db = new Db('test', new Server('localhost', 27017));
	db.open(function(err, db) {
	var collection = db.collection("users");
	var purchasedStocks = db.collection("purchasedStocks");

	// ******************************************************************************
	// 									Confirm Login
	// ******************************************************************************
    if(event.length == 2){
		
		collection.find({emailAddress:event[0]}, {_id:0}).toArray(function(err, item) {
					console.log(item);
					item = JSON.stringify(item);

					var firstName = item.match('firstName":"(.*)","lastName');
					var lastName = item.match('lastName":"(.*)","emailAddress');
					var email = item.match('emailAddress":"(.*)","password');
					var password = item.match('password":"(.*)","totalPrice');
					var totalPrice = item.match('totalPrice":(.*),"buyingPower');
					var buyingPower = item.match('buyingPower":(.*),"liquidMoney');
					var liquidMoney = item.match('liquidMoney":(.*)}]');
					console.log("event:" + event[0]);
					console.log("password:" + password[1]);
								
					  // Successful Login Attempt
					  if(event[1] == password[1]){
						  	var userLogin = {
								firstName: firstName[1],
								lastName: lastName[1],
								email: email[1],
								password: password[1],
								totalPrice: totalPrice[1],
								buyingPower: buyingPower[1],
								liquidMoney: liquidMoney[1]
							   };

						  	socket.emit("message",userLogin);
						  	console.log("*** SUCCESSFUL LOGIN ***");
					  }

					  // Failed Login Attempt
					  else{
					  	socket.emit("message",0);
					  	console.log("*** LOGIN FAILED ***");
					  }
		})
    }

    // ******************************************************************************
	// 									Purchase Stock
	// ******************************************************************************
    if(event.length == 6){
    	console.log("***** Attempting Purchase Stock *****");
    	collection.find({emailAddress:event[0]}, {_id:0}).toArray(function(err2, results) {
			results = JSON.stringify(results).split(':');
			liquidMoney = parseInt(results[7].slice(0,-2));


			//Grab the user's buyingPower and liquidMoney
			buyingPower = parseInt(results[6].substr(0,results[6].indexOf(",")));
			totalCost = parseInt(event[2]) * parseInt(event[3]);
			

			// MAKE SURE USER CANNOT ADD MULTIPLE OF THE SAME STOCK


			// Check to see user can afford stock
			if(totalCost < buyingPower){
				console.log("***** Stock Added Successfully *****");
			    purchasedStocks.insert(
					{
						email: event[0],
						symbol: event[1],
						purchasePrice: event[2],
						quantity: event[3],
						total: event[4],
						purchaseDate: event[5]
				})

				newBuyingPower = buyingPower - totalCost;
				newLiquidMoney = liquidMoney + totalCost;
				collection.update({emailAddress:event[0]},{$set:{buyingPower:newBuyingPower,liquidMoney:newLiquidMoney}})
				collection.save();
				var sendData = [newLiquidMoney,newBuyingPower];
				console.log("NEW L: " + sendData);
				console.log("New B: " + newBuyingPower)

				socket.emit("message", sendData);			
			}

			else{
				console.log("***** Failed to Purchase Stock *****");
			}			
				   	// collection.remove();
				   	// purchasedStocks.remove();
		})
    }


    // ******************************************************************************
	// 									Add New User
	// ******************************************************************************
    else if(event.length == 7){
    		console.log("******* Attempting to Add New User *********");

    		collection.find({password:event[3]}, {_id:0}).toArray(function(err2, results) {
			results = JSON.stringify(results);

				// Check if User already exists
				if(results == '[]'){
					collection.insert(
						{
							firstName: event[0],
							lastName: event[1],
							emailAddress: event[2],
							password: event[3],
							totalPrice: event[4],
							buyingPower: event[5],
							liquidMoney: event[6]
						})
					console.log("******* USER DATABASE *********");
				
					setTimeout(function() {
						collection.find({}).toArray(function(err, item) {
						console.log(item);
					 })}, 100);
				}			
						     
				else{
					console.log("******* Failed, user already exists *********");
					ocket.emit("message",1);
				}
	    	});
    }


   // ******************************************************************************
	// 									Load Portfolio
	// ******************************************************************************
	else if(event.indexOf("@@@") > -1){
    		console.log("******* Attempting to Load Portfolio *********")
    		var email = event.slice(0, -3);
    		
    		var stockList = [];	//List of stocks owned by user

    		purchasedStocks.find({email:email}, {_id:0}).toArray(function(err2, results) {
    				results = JSON.stringify(results);
    				results = results.split('{');

		    		
    				//Parse and greab all user symbols
    				for(var i = 1; i < results.length; i+=1){
    					var line = results[i];
	    				var symb = line.split(':"');
	    				symb = symb[2];
	    			    symb = (symb.split('"')[0]);
						var userStock = {symbol: symb};
						stockList.push(userStock);
    				}
    					
    			collection.find({emailAddress:email}, {_id:0}).toArray(function(err2, results) {
					results = JSON.stringify(results).split(':');
					liquidMoney = parseInt(results[7].slice(0,-2));
					totalPrice = parseInt(results[5].substr(0, results[5].indexOf(",")));
					
					buyingPower = parseInt(results[6].substr(0,results[6].indexOf(",")));
					console.log("NEW L: " + liquidMoney);
					console.log("New B: " + buyingPower);

					socket.emit("message1", JSON.stringify([totalPrice,liquidMoney,buyingPower]));

				})



    			console.log(JSON.stringify(stockList));
    			socket.emit("messages", JSON.stringify(stockList));
    		    console.log("******* Portflio Successfully Loaded *********");		

    		});
    	}

    else{
    	console.log("ERROR ERROR AWKWARD INPUT");
    }

   });

 });

});

console.log('Server running at http://127.0.0.1:' + port + '/');



