const express = require('express'),
	PORT = process.env.PORT || 80;

var app = express();

var server = app.listen(PORT);

app.use(express.static('public'));
console.log('Listening on PORT ' + PORT);
