"use strict";
//You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';
var webSocketsServerPort = 1234;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http'),url = require('url'),path=require('path'),fs=require('fs');

/**
 * Global variables
 */
// latest 100 messages
var history = [ ];
// list of currently connected clients (users)
var clients = [ ];

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
		.replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Array with some colors
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {



	var uri=url.parse(request.url).pathname;
	var filename=path.join(process.cwd(),uri);

	path.exists(filename,function(exists){
		if(!exists) {
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.write(uri);
			response.write("404 Not Found\n");
			response.end();
			return;
		}
		if (fs.statSync(filename).isDirectory()) filename += '/index.html';

		fs.readFile(filename, "binary", function(err, file) {
			if(err) {
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(err + "\n");
				response.end();
				return;
			}
			response.writeHead(200);
			response.write(file, "binary");
			response.end();
	});
	});

// Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
	console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({

// WebSocket server is tied to a HTTP server. WebSocket request is just
// an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
	httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

// accept connection - you should check 'request.origin' to make sure that
// client is connecting from your website
// (http://en.wikipedia.org/wiki/Same_origin_policy)
	var connection = request.accept(null, request.origin);
// we need to know client index to remove them on 'close' event
	var index = clients.push(connection) - 1;
	var userName = false;
	var userColor = false;

	console.log((new Date()) + ' Connection accepted.');

// send back chat history
	if (history.length > 0) {
		connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
	}

// user sent some message
	connection.on('message', function(message) {
		if (message.type === 'utf8') { // accept only text
			if (userName === false) { // first message sent by user is their name
// remember user name
				userName = htmlEntities(message.utf8Data);
// get random color and send it back to the user
				userColor = colors.shift();
				connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
				console.log((new Date()) + ' User is known as: ' + userName
					+ ' with ' + userColor + ' color.');

			} else { // log and broadcast the message
				console.log((new Date()) + ' Received Message from '
					+ userName + ': ' + message.utf8Data);
// we want to keep history of all sent messages
				var obj = {
					time: (new Date()).getTime(),
					text: htmlEntities(message.utf8Data),
					author: userName,
					color: userColor
				};
				history.push(obj);
				history = history.slice(-100);

// broadcast message to all connected clients
				var json = JSON.stringify({ type:'message', data: obj });
				for (var i=0; i < clients.length; i++) {
					clients[i].sendUTF(json);
				}
			}
		}
	});
	connection.on('error',function(){

	});
// user disconnected
	connection.on('close', function(connection) {
		if (userName !== false && userColor !== false) {
			console.log((new Date()) + " Peer "
				+ connection.remoteAddress + " disconnected.");
// remove user from the list of connected clients
			clients.splice(index, 1);
// push back user's color to be reused by another user
			colors.push(userColor);
		}
	});

});