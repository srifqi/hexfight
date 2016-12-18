// NOTE: Requires the 'ws' module.
// Use 'npm install --save ws' to install.

var http = require('http'),
    wss  = require('ws').Server;

module.exports = {};

module.exports.port = function(port) {
  this = port;
};

module.exports.http = function(callback) {
  http.createServer((req, res) => {
    callback({
      
    }, {
      
    });
  }.listen(module.exports.port);
};

exports.socket = function(callback) {
  wss = new wss({ port: module.exports.port });

  wss.on('connection', (ws) => {
    callback({
      
    };
  };
};
