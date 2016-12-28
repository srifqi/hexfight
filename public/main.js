// HexFight - a game | MIT License

var socket = io.connect('//' + location.hostname);

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
	this.drawPoints = 0;
	this.pos = new v2();
};

Object2D.prototype.die = function () {
	this.points = 0;
	this.drawPoints = 0;
};

Object2D.prototype.draw = function () {
	// this.drawPoints += (this.points - this.drawPoints) * .5;
	this.drawPoints = this.points;
};

var Player = function (name, element) {
	Object2D.call(this);

	this.name = name || 'guest';
	this.type = TYPE_PLAYER;

	this.element = element || null;
	this.powers = {};
	this.points = 25;

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
Player.prototype.draw = function (ctx, isOther) {
	Object2D.prototype.draw.call(this);
	if (!isOther) {
		ctx.translate(this.pos.x, -this.pos.y);
	}
	ctx.beginPath();
	ctx.moveTo(this.points, 0);
	for (var i = 1; i < 6; i++) {
		var x = this.drawPoints * Math.cos(i * Math.PI / 3);
		var y = this.drawPoints * Math.sin(i * Math.PI / 3);

		ctx.lineTo(x, -y);
	}
	ctx.closePath();
	ctx.strokeStyle = 'white';
	ctx.stroke();
	ctx.fillStyle = 'white';
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'center';
	ctx.font = this.points / 2 + 'px monospace';
	ctx.fillText(this.name, 0, 0);
	ctx.fillText(this.points, 0, this.points / 2);
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
	this.points = 1;
	this.pos = new v2();
};

Food.prototype = Object.create(Object2D.prototype);
Food.constructor = Food;

Food.prototype.draw = function (ctx) {
	Object2D.prototype.draw.call(this);
	ctx.translate(this.pos.x, -this.pos.y);
	ctx.beginPath();
	ctx.moveTo(this.points, 0);
	for (var i = 1; i < 3; i++) {
		var x = this.drawPoints * Math.cos(i * Math.PI * 2 / 3);
		var y = this.drawPoints * Math.sin(i * Math.PI * 2 / 3);

		ctx.lineTo(x + 10, -y+10);  	
+ }
	ctx.closePath();
	var hue = Math.log(this.element) / Math.log(2) * 60;
	ctx.strokeStyle = 'hsl(' + hue + ',100%,50%)';
	ctx.stroke();
};
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
		if (this.ids.indexOf(id) < 0) {
			this.ids.push(id);
			this.children.push(player);
		} else {
			this.children[index] = player;
		}

		return this;
	},
	addFirst: function (id, player) {
		this.ids.splice(0, 0, id);
		this.children.splice(0, 0, player);

		return this;
	},
	kill: function (id) {
		this.children[id].die();

		this.ids.splice(id, 1);
		this.children.splice(id, 1);
	}
};

var Game = function () {
	this.started = false;
	this.world = new World();

	this.game_over = false;
	this.game_update = null;

	this.canvas = null;
	this.ctx = null;
	this.player = null;

	this.width = 0;
	this.height = 0;
};

Game.prototype = {
	start: function (canvas, name, element) {
		this.game_over = false;

		this.player = new Player(name, element);

		this.world = new World();
		this.world.addFirst(socket.id, this.player);

		this.canvas = canvas;
		this.canvas.scale = 1;
		this.ctx = this.canvas.getContext('2d');

		window.addEventListener('resize', (function (that) {
			return function () {
				that.windowResizeHandler();
			};
		})(this));
		this.windowResizeHandler();

		this.canvas.addEventListener('mousemove', (function (that) {
			return function (ev) {
				if (that.game_over) return;

				var x = ev.clientX - that.width / 2;
				var y = -(ev.clientY - that.height / 2);
				if (x * x + y * y <= that.player.points * that.player.points * that.canvas.scale * that.canvas.scale) {
					that.player.steer(0, 0);
				} else {
					var angle = Math.atan(y / x);
					if (y < 0 && x < 0) {
						angle += Math.PI;
					} else if (y >= 0 && x < 0) {
						angle += Math.PI;
					} else if (y < 0 && x >= 0) {
						angle += 2 * Math.PI;
					}
					that.player.steer(angle, Math.log10(that.player.points) * 2);
				}

				socket.emit('update', that.player);
			};
		})(this));

		socket.emit('init', this.player);

		this.game_update = setInterval((function (that) {
			return function (ev) {
				that.update();
			};
		})(this), 1000 / 60);

		this.render();

		this.started = true;

		return this;
	},
	checkCollision: function () {
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
		if (socket.id !== this.world.ids[0]) {
			this.stop();

			return;
		}
		this.player.move();
		for (var i = 1; i < this.world.children.length; i++) {
			if (this.world.children[i].type === TYPE_PLAYER) {
				this.world.children[i].move();
			}
		}

		this.checkCollision();
	},
	stop: function () {
		if (this.started === false || this.game_over === true) return;
		this.started = false;
		this.game_over = true;
		clearInterval(this.game_update);

		socket.emit('dies', this.player);
		alert('Game over!');

		this.ctx.clearRect(0, 0, this.width, this.height);

		goMenu();
	},
	render: function () {
		if (this.game_over) return;

		this.ctx.clearRect(0, 0, this.width, this.height);
		this.canvas.targetScale = .2 * this.height / this.player.points;
		this.canvas.scale += (this.canvas.targetScale - this.canvas.scale) * .05;
		var scale = this.canvas.scale;
		var scale2 = 2 * this.canvas.scale;

		this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
		this.ctx.translate(-this.player.pos.x + this.width / scale2, this.player.pos.y + this.height / scale2);
		this.player.draw(this.ctx, false);
		for (var i = 1; i < this.world.children.length; i++) {
			this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
			this.ctx.translate(-this.player.pos.x + this.width / scale2, this.player.pos.y + this.height / scale2);
			this.world.children[i].draw(this.ctx);
		}

		this.ctx.setTransform(1, 0, 0, 1, 0, 0);

		this.ctx.font = '32px monospace';
		this.ctx.fillText(this.world.children.length, 50, 50);

		requestAnimationFrame((function (that) {
			return function () {
				that.render();
			};
		})(this));
	},
	windowResizeHandler: function (ev) {
		this.width = this.canvas.width = window.innerWidth;
		this.height = this.canvas.height = window.innerHeight;

		this.canvas.style.width = window.innerWidth + 'px';
		this.canvas.style.height = window.innerHeight + 'px';
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
// The Client Cycle //
// ---------------- //

var game = new Game();

socket.on('connect', function () {
	goMenu();
	if (btn_play.getAttribute('disabled') != null) {
		btn_play.removeAttribute('disabled');
	}
});

socket.on('disconnect', function () {
	game.stop();
	goMenu();
	btn_play.setAttribute('disabled', '');
});

socket.on('world_update', function (data) {
	if (this.started === false || this.game_over === true) return;

	game.world.ids.splice(1);
	game.world.children.splice(1);
	var ids = data.ids;
	var ch = data.children;
	for (var i = 0; i < ch.length; i++) {
		if (ids[i] === socket.id) {
			game.player.copy(ch[i]);
			continue;
		}

		if (ch[i].type === TYPE_PLAYER) {
			var player = new Player();
			player.copy(ch[i]);
			game.world.children.push(player);
		} else if (ch[i].type === TYPE_FOOD) {
			var food = new Food();
			food.copy(ch[i]);
			game.world.children.push(food);
		}
		game.world.ids.push(ids[i]);
	}
});

// --------- //
// Main Menu //
// --------- //

function goMenu () {
	dLoading.style.display = 'none';
	dMenu.style.display = '';
	dGame.style.display = 'none';
}

function goGame () {
	dLoading.style.display = 'none';
	dMenu.style.display = 'none';
	dGame.style.display = '';
}

function goPlay () {
	if (nick.value.length < 1) return;
	goGame();
	game.start(c, nick.value);
}
