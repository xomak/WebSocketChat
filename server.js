var sys = require("sys");
// подключаем библиотеку для создания web-socket-сервера 
var ws = require("ws");
// объявляем массив, в котором будем хранить весь список подключённых пользователей 
var clientsArr = [];
// создаем веб-сокет-сервер 
var wsServer = ws.createServer(function(websocket){
	// добавляем обработчик события,
	// которое сработает при подключении нового пользователя
	websocket.addListener("connect", function() {
		// добавляем это соединения в массив пользователей
		clientsArr.push(websocket);
		sys.debug("Connection. Clients amount: "+clientsArr.length);
	});
	// добавляем обработчик события,
	// которое сработает при получении новых данных от пользователя,
	// а точнее, когда пользователь отправит сообщение
	websocket.addListener("data", function(data) {
		// выведем сообщение в терминал на сервере
		sys.debug(data);
		// Рассылаем это сообщение всему списку подключенных пользователей
		for(var i=0, l=clientsArr.length; i<l; i++) {
			clientsArr[i].write(data);
		}
	});
	// добавляем обработчик события,
	// которое сработает при закрытии соединения с пользователем
	websocket.addListener("close", function() {
		// найдём, какое именно соединение было закрыто
		// и удалим его из списка пользователей
		for(var i=0, l=clientsArr.length; i<l; i++) {
			if(websocket == clientsArr[i]) {
				clientsArr.splice(i,1);
				sys.debug("Disconnection. Clients amount: "+clientsArr.length);
				break;
			}
		}
	});
});
// поставим наш сервер на прослушивание 8888-го порта 
// на наличие подключений и новых сообщений 
wsServer.listen(8888);
// Выведем отладочную информацию в терминале на сервере с адресом этого сервера, 
// по которому нужно подключатся клиентам 
sys.debug("Server running at ws://...80");