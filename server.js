var sys = require('sys'),
http = require('http');
var i=0;
http.createServer(function (req, res) {
i++;
res.writeHead(200, {'Content-Type': 'text/plain'});
res.write('Hello World'+i+'\n');
res.end();
}).listen(80);
sys.puts('Server running at 127.0.0.1:80/');
