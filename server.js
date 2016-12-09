var net = require('net');

net.createServer((socket) => {
  console.log('connection made');
}).listen(process.env.PORT);
