const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
	res.writeHead(200);
	fs.createReadStream('./test/index.html').pipe(res);
}).listen(9000);
