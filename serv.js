"use strict";

var
	wsport = 1234,
	httpport = 80,
	wsServer = new ( require( 'ws' ) ).Server( { port: wsport } ),
	http = require( 'http' ),
	url = require( 'url' ),
	fs = require( 'fs' ),
	path = require( 'path' ),
	redis = require( 'redis' ),
	logWs = {},
	listWs = [],
	connectedDevs = {},
	logReceiver1 = fs.readFileSync( 'logReceiver1.html' ),
	logDevList1 = fs.readFileSync( 'logDevList1.html' ),

	_sendLisOfDevs = function () {
		listWs.forEach( function ( _ws ) { try { _ws.send( JSON.stringify( connectedDevs ) ); } catch ( e ) { console.log( e ); } } );
	};

//redis
var redClient = redis.createClient();
redClient.on( "ready" , function(){
	console.log( "Redis : we are ready" );
})
redClient.on( "error" , function(err){
	console.log( "Redis client error " + err );
})

redClient.set("1","222222222222");

console.log( 'Started...' );

http.createServer( function ( req, res ) {
	var origin = ( "*" );
	if ( req.method.toUpperCase() === "OPTIONS" ){
		res.writeHead(
			"204",
			"No Content",
			{
				"access-control-allow-origin" : origin,
				"access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
				"access-control-allow-headers": "content-type, accept",
				"access-control-max-age": 10, // Seconds.
				"content-length": 0
			}
		);
		return( res.end() );
	}

	var up = url.parse( req.url, true ),
		dID = up.query.dID,
		tRunID = up.query.tRunID;

	if( up.pathname == '/aj/tid' ){
		res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});

		var args = [dID,new Date().getTime()-86400000*2,new Date().getTime()-86400000];
		redClient.zremrangebyscore(args,function(err,response){
			if(err) throw err;

		});
		redClient.zrange( dID,0,-1, function(err,reply){
			res.end( reply );
		});
		return;
	}
	if( up.pathname == '/aj/logs'){
		res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
		redClient.get( tRunID, function(err,reply){
			res.end( reply );
		});
		return;
	}

	res.writeHead( "200","OK",{ 'Content-Type': 'text/html'
	,'Access-Control-Allow-Origin':' * '
	,'Access-Control-Allow-Methods':'GET,OPTIONS'
	,'Access-Control-Allow-Headers':'X-Requested-With'
	} );

	res.end( dID ? logReceiver1 : logDevList1 );

} ).listen( httpport );
console.log( 'Http Begin listening :' + httpport );
/*
 http.createServer(function(request, response) {
 var up = url.parse( request.url, true ), dID = up.query.dID;
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

 */

wsServer.on( 'connection', function ( ws ) {
	var up = url.parse( ws.upgradeReq.url, true ),
		dID = up.query.dID,
		tRunId = up.query.tRunID,
		role = up.path.split( '/' )[ 1 ] || 'listen';
	var uniqueRedIDKeyLogs = tRunId ;

	if( tRunId ){
		redClient.append ( dID + ":tRunID", tRunId ) ;
		var args = [ dID, new Date().getTime(), tRunId ];
		redclient.zadd(args, function (err, response) {
			if (err) throw err;
		});
	}

	switch ( role ) {
		case 'list' :
			ws.on( 'close', function () {
				var i = listWs.indexOf( ws );
				if ( i > -1 ) { listWs.splice( i, 1 ); }
				console.log( 'Listener of devices list gone away...' );
			} );
			console.log( 'Listener of devices list connected (total ' + listWs.length + ')' );
			listWs.push( ws );
			try { ws.send( JSON.stringify( connectedDevs ) ); } catch ( e ) { console.log( e ); }
		break;

		case 'send' :
			if ( !logWs[ dID ] ) { logWs[ dID ] = { listeners : [] }; }
			connectedDevs[ dID ]={ devName : up.query.dName || '', connected : 1 };
			console.log((connectedDevs[dID]).devName);
			console.log( 'Device ' + dID + ' connected' );
			_sendLisOfDevs();
			ws.on( 'message', function( json ) {
				if ( !dID ) { ws.close(); return; }
				if ( !logWs[ dID ] ) {
					console.log( 'wtf1?' );
					logWs[ dID ] = { listeners : [] };
					connectedDevs[ dID ] = up.query.dName || '';
				} else {
					redClient.append( tRunId , json + "|delimiter|" );
					redClient.expire( tRunId, new Date().getTime() );
					logWs[ dID ].listeners.forEach( function ( _ws ) {
						try {
							_ws.send( json );
						} catch ( e ) {
							console.log( e );
						}
					} );
				}
			} );
			ws.on( 'close', function () {
				if ( connectedDevs[dID] )
				{ (connectedDevs[dID]).connected = 0;
					console.log('Disconnect ' + (connectedDevs[dID]).connected);
					//delete connectedDevs[ dID ];
					if(logWs[ dID ]){
						if ( !logWs[ dID ].listeners.length ) {
							delete logWs[ dID ];
						}
						}
				}
				_sendLisOfDevs();
				console.log( 'Device ' + dID + ' gone away...' );
			} );
		break;

		default :
			if ( !dID ) { ws.close(); return; }
			if ( !logWs[ dID ] ) {
				logWs[ dID ] = { listeners : [ ws ] };
			} else {
				logWs[ dID ].listeners.push( ws );
			}
			console.log( 'Listener for device ' + dID + ' connected (total ' + logWs[ dID ].length + ')' );
			ws.on( 'close', function () {
				var i = logWs[ dID ].listeners.indexOf( ws );
				if ( i > -1 ) { logWs[ dID ].listeners.splice( i, 1 ); }
				console.log( 'Listener for device ' + dID + ' gone away...' );
			} );
	}
} );

console.log( 'Begin listening :' + wsport );
