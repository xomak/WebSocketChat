http = require( 'http' ),
	url = require( 'url' ),
	fs = require( 'fs' ),
	path=require('path'),
	logWs = {},
	listWs = [],
	connectedDevs = {};


console.log( 'Started...' );

var server = http.createServer(function(request, response) {
	var uri=url.parse(request.url).pathname;
	var filename=path.join(process.cwd(),uri);
	console.log('ur1 '+request.url);
	console.log('aaaa');
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
	console.log('ur12 '+request.url);
// Not important for us. We're writing WebSocket server, not HTTP server
}).listen(80);



//http.createServer( function ( req, res ) {
//	var up = url.parse( req.url, true ), devID = up.query.devID;
//	res.writeHead( 200, { 'Content-Type': 'text/html' } );
//	res.end( devID ? logReceiver : logDevList );
//} ).listen( 80 );


var clients = [];
var client_name = [];
var WebSocketServer = require('ws').Server
	, wss = new WebSocketServer({port: 1234});
wss.on('connection', function(ws) {
	console.log('yes');
	ws.on('message', function(message) {
		if(message.indexOf("connect_name:") == 0) { //client is connecting
			console.log('+ %s', message);

			name = message.substr(13);

			broadcast('<i> ' + name + ' has joined the chat room. </i>'); //tell everyone you have joined the chatroom

			clients.push(ws); //add client to list of active clients
			client_name.push(name) // associate client with name

			ws.send('<i>You have joined the chat room.</i>');
			ws.send('There are currently ' + clients.length + ' users online');

		} else {
			index = clients.indexOf(ws);
			name =  client_name[index];
			console.log('%s: %s', name, message);

			broadcast("<b>" + name + "</b>: " + message);
		}

	});

	ws.on('close', function(message) {
		//Remove the disconnecting client from the list of clients
		index = clients.indexOf(ws);
		disconnecting_name = client_name[index];

		clients.splice(index,1);
		client_name.splice(index, 1);

		console.log('- disconnect_name:%s'+ disconnecting_name);

		broadcast('<i> ' + disconnecting_name + " left the chatroom. </i>");
	});


	ws.send('<b>Welcome to Simple Chat</b>');
});

//send message to all clients
function broadcast(message) {
	for (var i = 0; i < clients.length; i++) {
		client = clients[i];
		client.send(message);
	}
}