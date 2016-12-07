var http = require('http'),
    net  = require('net'),
    path = require('path');
    fs   = require('fs');

var index = fs.readFileSync(path.join(__dirname, 'public/index.html')).toString();

http.createServer((req, res) => {
  if (req.headers['x-forward-proto'] != 'https') {
    res.writeHead(302, {
      'Location': 'https:\\' + req.headers.host + '/'
    });
    res.end();
  } else if (req.url == '/') {
    red.end(index);
  } else {
   /* res.writeHead(302, {
      'Location': 'https:\\' + req.headers.host + '/'
    });
    res.end();*/
  }
}).listen(process.env.PORT);
