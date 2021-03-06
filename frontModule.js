'use strict';
var moduleMain = (function() {

	return {

		fgetLogst   : function(tRunID,callback) {
			var url = "40.dev.soft-artel.com:1234/aj/logs?tRunID" + tRunID;
			var ajaxOb = typeof XMLHttpRequest != 'undefined' ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
			ajaxOb.open('POST',url,true);
			ajaxOb.onreadystatechange = function(){
				if (ajaxOb.readyState != 4 ) return;
				if (ajaxOb.readyState == 4 )
					{
					if( ajaxOb.status==200 )
							callback.call( ajaxOb.responseText );
					}
			}
			ajaxOb.send(null);
		},
		fgetRunID   : function(dID,callback) {
			var url = "40.dev.soft-artel.com:1234/aj/tid?dID=" + dID;
			var ajaxOb = typeof XMLHttpRequest != 'undefined' ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
			ajaxOb.open('POST',url,true);
			ajaxOb.onreadystatechange = function(){
				if (ajaxOb.readyState != 4 ) return;
				if (ajaxOb.readyState == 4 )
				{
					if( ajaxOb.status==200 )
						callback.call( ajaxOb.responseText );
				}
			}
			ajaxOb.send( null );
		},
		LogDevList  : function ( w, d ,callback) {
			d.addEventListener( "DOMContentLoaded", function _onloaded () {
				d.removeEventListener( "DOMContentLoaded", _onloaded, false );
				if ( 'WebSocket' in window ) {
					try{
						w._logWebSocket = new WebSocket( "ws://40.dev.soft-artel.com:1234/list/" );
						w._logWebSocket.onmessage = function ( ev ) {
							var data;
							try {
								data = JSON.parse( ev.data );
							} catch ( e ) {
								console.log( e );
							}
							if ( data ) {
								callback(data);
							}
						}
						w._logWebSocket.onopen = function( ev ) {
							console.log('Connected');
						}
						w._logWebSocket.onerror = function( ev ) {
							console.log('Error, code: ' + ev.code + ', reason: ' + ev.reason );
						}
						w._logWebSocket.onclose = function( ev ) {
							console.log('Closed by server, code: ' + ev.code + ', reason: ' + ev.reason  );
						}
						///
					}catch (err){alert("error"+err.message);}
				} else {
					console.log('Sorry, webSockets doesnt support ') ;
				}

			}, false )},
		LogReceiver : function ( w, d ,callback) {

			d.addEventListener( "DOMContentLoaded", function _onloaded () {
				d.removeEventListener( "DOMContentLoaded", _onloaded, false );
				w._devID = parseSearch(w).dID || '';

				if ( 'WebSocket' in window ) {
					w._logWebSocket = new WebSocket( "ws://40.dev.soft-artel.com:1234/listen/?dID=" + w._devID );
					w._logWebSocket.onmessage = function ( ev ) {
						var data;

						console.log(ev.data);
						try {
							data = JSON.parse( ev.data );
						} catch ( e ) {
							console.log( e );
						}
						if ( data ) {
							callback(data);
						}

					}
					w._logWebSocket.onopen = function( ev ) {
						console.log('Connected');
					}
					w._logWebSocket.onerror = function( ev ) {
						console.log('Error, code: ' + ev.code + ', reason: ' + ev.reason + '')

					}
					w._logWebSocket.onclose = function( ev ) {
						console.log('Connected')
						_dom.log.innerHTML += 'Closed by server, code: ' + ev.code + ', reason: ' + ev.reason + '<br/>';
					}
				} else {
					console.log('Connected')
					_dom.log.innerHTML = 'Sorry, webSockets doesn\'t support (';
				}

			}, false );

		} ,
		parseSearch : function ( window ) {
			var r = {}, s = /([^&=]+)=?([^&]*)/g, d = function ( s ) { return decodeURIComponent( s.replace( /\+/g, " " ) );}, m;
			while ( m = s.exec( window.location.search.substring( 1 ) ) ) { r[ d( m[ 1 ] ) ] = d( m[ 2 ] ); }
			return r;
		}

	}
} ()	);






