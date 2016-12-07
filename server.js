var http = require('http'),
    net  = require('net'),
    path = require('path');
    fs   = require('fs');

var index = fs.readFileSync(path.join(__dirname, 'public/index.html')).toString();

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
  } else {
    res.writeHead(302, {
      'Location': 'https:\\' + req.headers.host + '/'
    });
    res.end();
  }
}).listen(process.env.PORT);
