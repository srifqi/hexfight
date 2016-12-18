// NOTE: Requires both 'express' and 'ws' modules.
// Use 'npm install --save express' to install express.
// Use 'npm install --save ws' to install ws.

var app = require('express')(),
    wss = require('ws').Server;

module.exports = {};

module.exports.port = function(port) {
  this = port;
};

module.exports.http = function(callback) {
  app.use((req, res) => {
    callback({
      
    }, {
      
    });
  }

  app.listen(module.exports.port);
};

module.exports.socket = function(callback) {
  wss = new wss({ port: module.exports.port });

  wss.on('connection', (ws) => {
    callback({
      
    };
  };
};
