function some_function2(url, callback) {
	var httpRequest;
	if (window.XMLHttpRequest) {
		httpRequest = new XMLHttpRequest();
	} else if (window.ActiveXObject) {
		httpRequest = new
			ActiveXObject("Microsoft.XMLHTTP");
	}
	httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState === 4 && httpRequest.status === 200) {
			callback.call(httpRequest.responseText); // вызываем колбек
		}
	};
	httpRequest.open('GET', url);
	httpRequest.send();
}

some_function2("text.xml", function () {
	console.log(this);
});
console.log("это выполнится до вышеуказанного колбека");
