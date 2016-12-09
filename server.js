var net = require('net');

net.createServer((socket) => {
  socket.write('lolz');
}).listen(process.env.PORT);
