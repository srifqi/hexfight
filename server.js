// HexFight - a game | MIT License

// Start the server.
const express = require('express'),
	PORT = process.env.PORT || 80;

var app = express();
var server = app.listen(PORT);
console.log('Listening on PORT ' + PORT);

app.use(express.static('public'));

// Initialize WebSocket (using Socket.IO).
var io = require('socket.io')(server);

// --------------- //
// The Game Engine //
// --------------- //

const TYPE_PLAYER = 1;
const TYPE_FOOD = 2;

const ELEMENT_1 = 1;
const ELEMENT_2 = 2;
const ELEMENT_3 = 4;
const ELEMENT_4 = 8;
const ELEMENT_5 = 16;
const ELEMENT_6 = 32;
const ELEMENTS = [
	ELEMENT_1, ELEMENT_2, ELEMENT_3, ELEMENT_4, ELEMENT_5, ELEMENT_6
];

var Object2D = function (name) {
	this.name = name || 'object';
	this.type = null;
	this.points = 0;
	this.pos = new v2();
};

Object2D.prototype.die = function () {
	this.points = 0;
};

var Player = function (name, element) {
	Object2D.call(this);

	this.name = name || 'guest';
	this.type = TYPE_PLAYER;

	this.element = null;
	this.powers = {};
	this.points = 65;

	this.pos = new v2();
	this.dir = new v2();
};

Player.prototype = Object.create(Object2D.prototype);
Player.constructor = Player;

Player.prototype.steer = function (angle, speed) {
	var x = speed * Math.cos(angle);
	var y = speed * Math.sin(angle);

	this.dir.set(x, y);
};
Player.prototype.move = function () {
	var force = this.dir.clone();
	force.multiplyScalar(.3);
	this.pos.add(force);
};
Player.prototype.copy = function (obj) {
	this.name = obj.name || 'guest';
	// this.type = TYPE_PLAYER; // No need to check type.

	this.element = obj.element;
	this.powers = obj.powers;
	this.points = obj.points;

	this.pos.copy(obj.pos);
	this.dir.copy(obj.dir);
};

var Food = function () {
	Object2D.call(this);

	this.name = 'food';
	this.type = TYPE_FOOD;
	this.element = null;
	this.points =Math.floor(Math.random() * 5);
	this.pos = new v2();
};

Food.prototype = Object.create(Object2D.prototype);
Food.constructor = Food;

Food.prototype.copy = function (obj) {
	this.name = obj.name;
	// this.type = TYPE_FOOD; // No need to check type.
	this.element = obj.element;
	this.points = obj.points;
	this.pos.copy(obj.pos);
};

var World = function (id) {
	this.id = id || 1;
	this.ids = [];
	this.children = [];
};

World.prototype = {
	add: function (id, player) {
		var index = this.ids.indexOf(id);
		if (index < 0) {
			this.ids.push(id);
			this.children.push(player);
		} else {
			this.children[index] = player;
		}

		return this;
	},
	placeRandomFood: function () {
		var food = new Food();
		food.element = ELEMENTS[Math.round(Math.random() * 5)];
		food.pos.add(new v2().set(
			Math.round(Math.random() * 10000 - 5000),
			Math.round(Math.random() * 10000 - 5000)
		));
		food.points = Math.round(Math.random() * 1 + 1);
		this.add(this.children.length + 1 + '', food);
	},
	kill: function (id) {
		this.children[id].die();

		this.ids.splice(id, 1);
		this.children.splice(id, 1);
	}
};

var Game = function () {
	this.world = new World();
	this.last_food = -1;
};

Game.prototype = {
	checkCollision: function () {
		if (this.world.children.length < 2) return;
		for (var i = 0; i < this.world.children.length; i++) {
			var ii = this.world.children[i];
			if (ii == undefined) continue;
			for (var j = i + 1; j < this.world.children.length; j++) {
				var jj = this.world.children[j];
				if (jj == undefined) continue;
				var dist = ii.pos.distanceSq(jj.pos);
				if (ii.points > jj.points && ii.points * ii.points >= dist) {
					if (ii.type === TYPE_PLAYER) ii.points += jj.points;
					this.world.kill(j);
				} else if (ii.points < jj.points && jj.points * jj.points >= dist) {
					if (jj.type === TYPE_PLAYER) jj.points += ii.points;
					this.world.kill(i);
				}
			}
		}
	},
	update: function () {
		for (var i = 0; i < this.world.children.length; i++) {
			if (this.world.children[i].type === TYPE_PLAYER) {
				this.world.children[i].move();
			}
		}

		if (Math.random() > 0.02) {
			this.world.placeRandomFood();
			this.last_food = Date.now();
		}

		// console.log(this.world.children.length);

		this.checkCollision();
	}
};

var v2 = function (x, y) {
	this.x = x || 0;
	this.y = y || 0;
};

v2.prototype = {
	set: function (x, y) {
		this.x = x;
		this.y = y;

		return this;
	},
	copy: function (v) {
		this.x = v.x;
		this.y = v.y;

		return this;
	},
	add: function (v) {
		this.x += v.x;
		this.y += v.y;

		return this;
	},
	sub: function (v) {
		this.x -= v.x;
		this.y -= v.y;

		return this;
	},
	multiply: function (v) {
		this.x *= v.x;
		this.y *= v.y;

		return this;
	},
	multiplyScalar: function (s) {
		this.x *= s;
		this.y *= s;

		return this;
	},
	distanceSq: function (v2) {
		var target = v2.clone();
		target.sub(this);
		return target.x * target.x + target.y * target.y;
	},
	distance: function (v2) {
		return Math.sqrt(this.distanceSq(v2));
	},
	clone: function () {
		var that = new v2();
		that.x = this.x;
		that.y = this.y;

		return that;
	}
};

// ---------------- //
// The Server Cycle //
// ---------------- //

var game = new Game();

// Run the game.
// (60 FPS)
function RUN () {
	game.update();
}
setInterval(RUN, 1000 / 60);

// Broadcast to players about all players in this game.
// (30 FPS)
function BC () {
	io.sockets.emit('world_update', game.world);
}
setInterval(BC, 1000 / 30);

// User I/O.
io.sockets.on('connection', function (socket) {
	console.log('New client: ' + socket.id + '.');

	socket.on('init', function (data) {
		var player = new Player(data.name, data.element);
		game.world.add(socket.id, player);
		console.log('A client join the game: ' + socket.id + '.');
	});

	socket.on('update', function (data) {
		var id = game.world.ids.indexOf(socket.id);
		if (id >= 0) {
			game.world.children[id].copy(data);
		}
	});

	socket.on('dies', function (data) {
		var id = game.world.ids.indexOf(socket.id);
		if (id >= 0) {
			game.world.kill(id);
		}
		console.log('A client dies: ' + socket.id + '.');
	});

	socket.on('disconnect', function () {
		var id = game.world.ids.indexOf(socket.id);
		if (id >= 0) {
			game.world.kill(id);
		}
		console.log('A client disconnected: ' + socket.id + '.');
	});
});
