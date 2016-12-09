var http = require('http'),
    net  = require('net'),
    path = require('path');
    fs   = require('fs'),
    port = process.env.PORT;

var index = fs.readFileSync(path.join(__dirname, 'public/index.html')).toString();

var core = fs.readFileSync(path.join(__dirname, 'public/core.js')).toString();

http.createServer((req, res) => {
  if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] == 'http') {
    res.writeHead(302, {
      'Location': 'https:\\' + req.headers.host + '/'
    });
    res.end();
  } else if (req.url.indexOf('?') > -1) {
    res.writeHead(302, {
      'Location': 'https:\\' + req.headers.host + '/'
    });
    res.end();
  } else if (req.url == '/') {
    res.end(index);
  } else if (req.url == '/core.js') {
    res.end(core);
  } else {
    res.writeHead(302, {
      'Location': 'https:\\' + req.headers.host + '/'
    });
    res.end();
  }
}).listen(port);

net.createServer((socket) => {
  socket.write(String(socket.remoteAddress));
}).listen(port);
