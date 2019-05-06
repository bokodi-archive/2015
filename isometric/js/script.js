var
	doc = window.document,
	body = doc.body,
	
	_id = function(id) {
		return doc.getElementById(id);
	}
;

function Point(x, y, offset) {
	this.x = x | 0;
	this.y = y | 0;
	this.offset = offset | 0;
}

_point = Point.prototype;

_point.toIsometric = function() {
	return {
		x: this.x - this.y + this.offset,
		y: (this.x + this.y) / 2
	};
};

_point.toCartesian = function() {
	return {
		x: (2 * this.y + this.x) / 2,
		y: (2 * this.y - this.x) / 2
	};
};

function Game(canvas, rows, cols, tileWidth, tileHeight) {
	this.canvas = canvas;
	this.ctx = canvas.getContext('2d');
	
	this.rows = rows | 0;
	this.cols = cols | 0;
	
	this.tw = tileWidth | 0;
	this.th = tileHeight | 0;
	
	this.canvas.width = this.width = (cols + rows) * tileWidth;
	this.canvas.height = this.height = (rows + cols) * tileHeight / 2 + tileHeight;
	
	this.treasure = new Audio();
	this.treasure.src = 'audio/treasure.ogg';
	
	this.load('img/source.png', this.addHero.bind(this, 3, 3, 'img/human.png'));
}

_game = Game.prototype;

_game.GRASS_TILE = 0;
_game.WALL_TILE = 1;
_game.GOLD_TILE = 2;

_game.WHITE = '#ffffff';
_game.BLACK = '#000000';

var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;
var KEY_LEFT = 37;

_game.start = function() {
	this.levelData = [];
	this.restartLevel();
	
	this.addListeners();
	
	this.loop();
};

_game.addHero = function(x, y, src) {
	this.hero = new Hero(x * this.tw, y * this.th, src, this.start.bind(this));
};

_game.restartLevel = function() {
	var x, y;
	
	// empty levelData
	while (this.levelData.length > 0) this.levelData.pop();
	
	// if there are too few rows or cols return
	if (this.rows < 2 || this.cols < 2) {
		return void 0;
	}
	
	// fill the first row with wall tiles
	y = 0;
	
	this.levelData[y] = [];
	for (x = 0; x < this.cols; x++) {
		this.levelData[y].push(this.WALL_TILE);
	}
	
	// fill the intermediate rows
	// first and last cols are wall tiles, the others are grass tiles
	for (y = 1; y < this.rows - 1; y++) {
		this.levelData[y] = [];
		
		this.levelData[y].push(this.WALL_TILE);
		
		for (x = 1; x < this.cols - 1; x++) {
			this.levelData[y].push(this.GRASS_TILE);
		}
		
		this.levelData[y].push(this.WALL_TILE);
	}
	
	// fill the last row with wall tiles
	this.levelData[y] = [];
	for (x = 0; x < this.cols; x++) {
		this.levelData[y].push(this.WALL_TILE);
	}
};

_game.addListeners = function() {
	var _this = this;
	
	this.canvas.addEventListener('click', function(e) {
		var tileType = +doc.querySelector('input[name="tile"]:checked').value;
		var pt = new Point(e.layerX - _this.rows * _this.tw, e.layerY - _this.th).toCartesian();
		
		_this.changeTile(
			pt.x / _this.th | 0,
			pt.y / _this.th | 0,
			tileType
		);
		
		//_this.render();
	});
	
	doc.addEventListener('keydown', function(e) {
		var key = e.keyCode || e.which;
		
		switch (key) {
			case KEY_UP:
				_this.heroUp = true;
				break;
			case KEY_RIGHT:
				_this.heroRight = true;
				break;
			case KEY_DOWN:
				_this.heroDown = true;
				break;
			case KEY_LEFT:
				_this.heroLeft = true;
				break;
		}
	});
	
	doc.addEventListener('keyup', function(e) {
		var key = e.keyCode || e.which;
		
		switch (key) {
			case KEY_UP:
				_this.heroUp = false;
				break;
			case KEY_RIGHT:
				_this.heroRight = false;
				break;
			case KEY_DOWN:
				_this.heroDown = false;
				break;
			case KEY_LEFT:
				_this.heroLeft = false;
				break;
		}
	});
};

_game.changeTile = function(x, y, type) {
	if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
		this.levelData[y][x] = type | 0;
	}
};

_game.load = function(src, callback) {
	this.source = new Image();
	this.source.addEventListener('load', callback);
	this.source.src = src;
};

_game.clear = function() {
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

_game.update = function() {
	var facing,
		ox, oy,
		heroCoord,
		dX = 0,
		dY = 0;
	
	if (this.heroUp) {
		dY = -1;
	} else if (this.heroDown) {
		dY = 1;
	} else {
		dY = 0;
	}

	if (this.heroRight) {
		dX = 1;
		
		if (dY === 0) {
			facing = 'E';
		} else if (dY === 1) {
			facing = 'SE';
			dX = dY=0.5;
		} else {
			facing = 'NE';
			dX = 0.5;
			dY = -0.5;
		}
	} else if (this.heroLeft) {
		dX = -1;
		
		if (dY === 0) {
			facing = 'W';
		} else if (dY === 1) {
			facing = 'SW';
			dY = 0.5;
			dX = -0.5;
		} else {
			facing = 'NW';
			dX = dY = -0.5;
		}
	} else {
		dX = 0;
		
		if (dY === 0) {
			// facing = 'W';
		} else if (dY === 1) {
			facing = 'S';
		} else {
			facing = 'N';
		}
	}
	
	ox = this.hero.x;
	oy = this.hero.y;
	
	this.hero.x += this.hero.speed * dX;
	this.hero.y += this.hero.speed * dY;
	
	heroCoord = this.hero.getCoord(this.th);

	if (dX !== 0 || dY !== 0) {
		this.hero.animate(facing);
	}
	
	if (
		this.levelData[heroCoord.y] === undefined ||
		this.levelData[heroCoord.y][heroCoord.x] === undefined ||
		this.levelData[heroCoord.y][heroCoord.x] === this.WALL_TILE
	) {
		this.hero.x = ox;
		this.hero.y = oy;
		
		return void 0;
	}
	
	if (this.levelData[heroCoord.y][heroCoord.x] === this.GOLD_TILE) {
		this.treasure.play();
		this.levelData[heroCoord.y][heroCoord.x] = this.GRASS_TILE;
	}
};

_game.render = function() {
	this.clear();
	
	this.ctx.beginPath();
	
	var x, y,
		sw = this.source.width / 3,
		heroPos = new Point(this.hero.x, this.hero.y, (this.rows - 1) * this.tw).toIsometric(),
		heroCoord = this.hero.getCoord(this.th),
		sx, pt;

	for (x = 0; x < this.rows; x++) {
		for (y = 0; y < this.cols; y++) {
			sx = this.levelData[x][y] === this.WALL_TILE ? 0 : sw;
			pt = new Point(y * this.th, x * this.tw, (this.rows - 1) * this.tw).toIsometric();
			
			this.ctx.drawImage(
				this.source,
				
				sx, 0,
				sw, this.source.height,
				
				pt.x, pt.y,
				sw, this.source.height
			);
			
			if (this.levelData[x][y] === this.GOLD_TILE) {
				this.ctx.drawImage(
					this.source,
					
					sw * 2, 0,
					sw, this.source.height,
					
					pt.x, pt.y,
					sw, this.source.height
				);
			}
			
			if (heroCoord.x === y && heroCoord.y === x) {
				this.ctx.drawImage(
					this.hero.img,
					
					this.hero.frame * this.hero.img.width / this.hero.c, this.hero.sy * this.hero.img.height / this.hero.r,
					this.hero.img.width / this.hero.c, this.hero.img.height / this.hero.r,
					
					heroPos.x, heroPos.y,
					this.hero.width, this.hero.height
				);
			}
		}
	}
};

_game.loop = function() {
	var _this = this;
	
	window.requestAnimationFrame(_this.loop.bind(_this));
	
	_this.update();
	_this.render();
};

function Hero(x, y, src, callback) {
	this.x = x | 0;
	this.y = y | 0;
	
	//this.width = 51;
	//this.height = 90;
	this.width = 120;
	this.height = 120;
	
	this.r = 8;
	this.c = 8;
	// this.c = 13;
	
	this.speed = 3;
	
	this.prescaler = 3;
	this.frame = 0;
	this.tick = 0;
	
	this.img = new Image();
	this.img.addEventListener('load', callback);
	this.img.src = src;
	
	this.animate('S');
}

_hero = Hero.prototype;

_hero.animate = function(facing) {
	if (this.facing !== this.convertFacing(facing)) {
		this.facing = this.convertFacing(facing);
		
		/*switch (this.facing) {
			case 'N':	this.sy = 4; break;
			case 'NE':	this.sy = 5; break;
			case 'E':	this.sy = 6; break;
			case 'SE':	this.sy = 7; break;
			case 'S':	this.sy = 0; break;
			case 'SW':	this.sy = 1; break;
			case 'W':	this.sy = 2; break;
			case 'NW':	this.sy = 3; break;
		}*/
		
		switch (this.facing) {
			case 'N':	this.sy = 2; break;
			case 'NE':	this.sy = 3; break;
			case 'E':	this.sy = 4; break;
			case 'SE':	this.sy = 5; break;
			case 'S':	this.sy = 6; break;
			case 'SW':	this.sy = 7; break;
			case 'W':	this.sy = 0; break;
			case 'NW':	this.sy = 1; break;
		}
		
		/*switch (this.facing) {
			case 'N':	this.sy = 1; break;
			case 'NE':	this.sy = 2; break;
			case 'E':	this.sy = 0; break;
			case 'SE':	this.sy = 5; break;
			case 'S':	this.sy = 4; break;
			case 'SW':	this.sy = 6; break;
			case 'W':	this.sy = 7; break;
			case 'NW':	this.sy = 3; break;
		}*/
	}
	
	if (++this.tick > this.prescaler) {
		this.tick = 0;
		if (++this.frame >= this.c) this.frame = 0;
	}
};

_hero.convertFacing = function(facing) {
	switch (facing) {
		case 'N': return 'NE';
		case 'NE': return 'E';
		case 'E': return 'SE';
		case 'SE': return 'S';
		case 'S': return 'SW';
		case 'SW': return 'W';
		case 'W': return 'NW';
		case 'NW': return 'N';
		
		default: return 'N';
	}
};

_hero.getCoord = function(th) {
	return {
		x: this.getXC() / th | 0,
		y: this.getYC() / th | 0
	};
};

_hero.getXC = function() {
	return this.x + this.width / 2;
};

_hero.getYC = function() {
	return this.y + this.height / 2;
};

_hero.getXE = function() {
	return this.x + this.width;
};

_hero.getYE = function() {
	return this.y + this.height;
};
