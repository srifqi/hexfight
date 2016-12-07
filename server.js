var http = require('http'),
    net  = require('net'),
    fs   = require('fs');

var index = fs.readFileSync('/public/index.HTML').toString();

http.createServer((req, res) => {
  if (req.headers['x-forward-proto'] != 'https') {
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
    red.end(index);
  } else {
    res.writeHead(302, {
      'Location': 'https:\\' + req.headers.host + '/'
    });
    res.end();
  }
}).listen(process.env.PORT);
