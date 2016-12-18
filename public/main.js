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
	this.drawPoints += (this.points - this.drawPoints) * .5;
};

var Player = function (name) {
	Object2D.call(this);

	this.name = name || 'guest';
	this.type = TYPE_PLAYER;

	this.element = null;
	this.powers = {};
	this.points = 10;

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

var Food = function () {
	Object2D.call(this);

	this.name = 'food';
	this.type = TYPE_FOOD;
	this.element = null;
	this.points = 1;
	this.pos = new v2();
};

Food.constructor = Food;

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

		ctx.lineTo(x, -y);
	}
	ctx.closePath();
	var hue = Math.log(this.element) / Math.log(2) * 60;
	ctx.strokeStyle = 'hsl(' + hue + ',100%,50%)';
	ctx.stroke();
};

var World = function (id) {
	this.id = id || 1;
	this.children = [];
};

World.prototype = {
	add: function (player) {
		this.children.push(player);

		return this;
	},
	placeRandomFood: function () {
		var food = new Food();
		food.element = ELEMENTS[Math.round(Math.random() * 5)];
		food.pos.add(new v2().set(
			Math.round(Math.random() * 1000 - 500),
			Math.round(Math.random() * 1000 - 500)
		));
		food.points = Math.round(Math.random() * 1 + 1);
		this.children.push(food);
	}
};

var Game = function () {
	this.world = new World();

	this.canvas = null;
	this.ctx = null;
	this.player = null;

	this.width = 0;
	this.height = 0;
};

Game.prototype = {
	start: function (canvas, name) {
		this.player = new Player(name);
		this.world.add(this.player);
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
				var x = ev.clientX - that.width / 2;
				var y = -(ev.clientY - that.height / 2);
				if (x * x + y * y <= that.player.points * that.player.points * that.canvas.scale * that.canvas.scale) {
					that.player.steer(0, 0);
					return;
				}

				var angle = Math.atan(y / x);
				if (y < 0 && x < 0) {
					angle += Math.PI;
				} else if (y >= 0 && x < 0) {
					angle += Math.PI;
				} else if (y < 0 && x >= 0) {
					angle += 2 * Math.PI;
				}
				that.player.steer(angle, Math.log10(that.player.points) * 2);
			};
		})(this));

		this.render();

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
					this.world.children.splice(j, 1);
					if (ii instanceof Player) ii.points += jj.points;
					jj.die();
				} else if (ii.points < jj.points && jj.points * jj.points >= dist) {
					this.world.children.splice(i, 1);
					if (jj instanceof Player) jj.points += ii.points;
					ii.die();
				}
			}
		}
	},
	render: function () {
		this.player.move();
		for (var i = 1; i < this.world.children.length; i++) {
			if (this.world.children[i] instanceof Player) {
				this.world.children[i].move();
			}
		}

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

		if (Math.random() > 0.9) this.world.placeRandomFood();

		this.checkCollision();

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
