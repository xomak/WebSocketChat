/**
 * Created by Илья on 08.05.14.
 */
"use strict";
var
	wsServer = new ( require( 'ws' ) ).Server( { port: 8100 } ),
	http = require( 'http' ),
	url = require( 'url' ),
	fs = require( 'fs' ),
	logWs = {},
	listWs = [],
	connectedDevs = {},

	logReceiver = fs.readFileSync( 'logReceiver.html'),
	logDevList = fs.readFileSync( 'logDevList.html'),

	_sendLisOfDevs = function () {
		listWs.forEach( function ( _ws ) { try { _ws.send( JSON.stringify( connectedDevs ) ); } catch ( e ) { console.log( e ); } } );
	}
	;

console.log( 'Started...' );

http.createServer( function ( req, res ) {
	var up = url.parse( req.url, true ), devID = up.query.devID; //, role = up.path.split( '/' )[ 1 ] || 'listen';
	res.writeHead( 200, { 'Content-Type': 'text/html' } );
	res.end( devID ? logReceiver : logDevList );
} ).listen( 80 );

console.log( 'Begin listening :8000' );

wsServer.on( 'connection', function ( ws ) {
	var up = url.parse( ws.upgradeReq.url, true ), devID = up.query.devID, role = up.path.split( '/' )[ 1 ] || 'listen';

	switch ( up.path.split( '/' )[ 1 ] ) {

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
			if ( !logWs[ devID ] ) { logWs[ devID ] = { listeners : [] }; }
			connectedDevs[ devID ] = up.query.devName || '';
			console.log( 'Device ' + devID + ' connected' );

			// send notification
			_sendLisOfDevs();

			ws.on( 'message', function( json ) {
				if ( !devID ) { ws.close(); return; }
				if ( !logWs[ devID ] ) {
					// WTF ?
					console.log( 'wtf1?' );
					logWs[ devID ] = { listeners : [] };
					connectedDevs[ devID ] = up.query.devName || '';
				} else {
					logWs[ devID ].listeners.forEach( function ( _ws ) {
						try {
							_ws.send( json );
						} catch ( e ) {
							// handle error
							console.log( e );
						}
					} );
				}
			} );

			ws.on( 'close', function () {
				delete connectedDevs[ devID ];
				_sendLisOfDevs();
				if ( !logWs[ devID ].listeners.length ) {
					delete logWs[ devID ];
				}
				console.log( 'Device ' + devID + ' gone away...' );
			} );
			break;

		default : // listen
			if ( !devID ) { ws.close(); return; }
			if ( !logWs[ devID ] ) {
				logWs[ devID ] = { listeners : [ ws ] };
			} else {
				logWs[ devID ].listeners.push( ws );
			}
			console.log( 'Listener for device ' + devID + ' connected (total ' + logWs[ devID ].length + ')' );
			ws.on( 'close', function () {
				var i = logWs[ devID ].listeners.indexOf( ws );
				if ( i > -1 ) { logWs[ devID ].listeners.splice( i, 1 ); }
				console.log( 'Listener for device ' + devID + ' gone away...' );
			} );
	}



} );

