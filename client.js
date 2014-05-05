// спрашиваем пользователя его имя 
var userName = prompt("Enter your name:");
// получаем ссылки на необходимые нам DOM-элементы: 
// поле ввода, кнопки, список сообщений 
var msg = document.getElementById("message");
var sendBtn = document.getElementById("sendButton");
var msgList = document.getElementById("messageList");
// Проверяем, поддерживает ли браузер веб-сокеты 
if(typeof(WebSocket)=="undefined") {
	// если не поддерживает - сообщаем об этом пользователю
	alert("Your browser does not support WebSockets. Try to use Chrome or Safari.");
} else {
	// иначе - создаем соединение с сервером,
	// указывая в качестве параметра его адрес и порт.
	// Обратите внимание на то, что используется протокол "ws" (сокращенно от WebSocket).
	var ws = new WebSocket("ws://40.dev.soft-artel.com:80");
	// создаем обработчик нажатия кнопки, по нажатию на которую,
	// мы отправим сообщение на сервер и очистим поле для ввода сообщений
	sendBtn.onclick = function() {
		ws.send(userName+": "+msg.value);
		msg.value = "";
	}
	// создаем обработчик события "onmessage",
	// которое сработает, когда сервер пришлёт нам сообщение
	ws.onmessage = function(event) {
		// добавляем пришедшее сообщение в список
		msgList.innerHTML = event.data+"<hr />" + msgList.innerHTML;
	}
} 