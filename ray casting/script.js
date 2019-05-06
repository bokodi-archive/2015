var
	canvas = document.getElementById('canvas'),
	ctx = canvas.getContext('2d'),
	w = canvas.width,
	h = canvas.height
;

var segments = [
	[50, 50, 150, 50],
	[200, 50, 200, 150],
	[400, 50, 400, 200],
	[250, 250, 350, 250],
	[100, 150, 100, 300],
	
	[125, 200, 225, 300],
	
	[275, 100, 325, 100],
	[325, 100, 325, 150],
	[324, 150, 275, 150],
	[275, 150, 275, 100]
];

var all = [
	[0, 0, w, 0],
	[w, 0, w, h],
	[w, h, 0, h],
	[0, h, 0, 0]
].concat(segments);

var points = [];
all.forEach(function(seg) {
	points.push(
		{
			x: seg[0],
			y: seg[1],
			seg: seg
		},
		{
			x: seg[2],
			y: seg[3],
			seg: seg
		}
	);
});

var _id = function(id) {
	return window.document.getElementById(id);
};

_id('use_click').addEventListener('click', addEventHandler);
_id('use_mousemove').addEventListener('mousemove', addEventHandler);

function addEventHandler() {
	var key = this.id.split('_')[1];
	
	canvas.removeEventListener(key === 'click' ? 'mousemove' : 'click', runner);
	canvas.addEventListener(key, runner);
}

var runner = function(e) {
	var x = e.layerX;
	var y = e.layerY;
	
	ctx.clearRect(0, 0, w, h);
	
	ctx.beginPath();
	ctx.fillStyle = '#111122';
	ctx.fillRect(0, 0, w, h);
	
	if (_id('showwalls').checked) {
		ctx.beginPath();
		ctx.strokeStyle = '#ffff55';
		segments.forEach(function(seg) {
			ctx.moveTo(seg[0], seg[1]);
			ctx.lineTo(seg[2], seg[3]);
		});
		ctx.stroke();
	}
	
	ctx.beginPath();
	ctx.fillStyle = '#eeee00';
	ctx.arc(x, y, 4.5, 0, Math.PI * 2);
	ctx.fill();
	
	if (_id('showrays').checked) {
		ctx.beginPath();
		ctx.strokeStyle = 'red';
		all.forEach(function(seg) {
			ctx.moveTo(x, y);
			ctx.lineTo(seg[0], seg[1]);
			ctx.moveTo(x, y);
			ctx.lineTo(seg[2], seg[3]);
		});
		ctx.stroke();
	}
	
	ctx.fillStyle = 'rgba(255,255,255,0.3)';
	var gradient = ctx.createRadialGradient(x, y, 0, x, y, (w+h) / 2 * 0.75);
	gradient.addColorStop(0.0, 'hsla(60, 100%, 75%, 0.5)');
	gradient.addColorStop(0.5, 'hsla(60, 50%, 50%, 0.3)');
	gradient.addColorStop(1.0, 'hsla(60, 60%, 30%, 0.1)');
	ctx.fillStyle = gradient;
	
	var uniquePoints = [].concat(points);
	var uniqueAngles = [];

	for (var j = 0; j < uniquePoints.length; j++) {
		var uniquePoint = uniquePoints[j];
		var angle = Math.atan2(uniquePoint.y - y, uniquePoint.x - x);
		uniquePoint.angle = angle;
		uniqueAngles.push(angle-0.00001,angle,angle+0.00001);
	}
	
	var intersects = [];
	var majaitems = [];
	var collinears = [];
	
	for (var j = 0; j < uniqueAngles.length; j++) {
		var angle = uniqueAngles[j];
		var dx = Math.cos(angle);
		var dy = Math.sin(angle);

		var closestIntersect = null;
		for (var i = 0; i < all.length; i++) {
			var intersect = getIntersection(x, y, x+dx, y+dy,	all[i][0], all[i][1], all[i][2], all[i][3]);
			if (!intersect) {
				// if (points[j / 3 | 0].seg === all[i]) console.log(points[j / 3 | 0].seg);
				if (collinear(x, y, all[i][0], all[i][1], all[i][2], all[i][3])) {
					if (collinears.indexOf(all[i]) === -1) collinears.push(all[i]);
				}
				continue;
			}
			
			if (!closestIntersect || intersect.param < closestIntersect.param) {
				if (intersect && Number.isNaN(intersect.param) && closestIntersect === null) {
					var majaitem = points[j / 3 | 0].seg;
					if (majaitems.indexOf(majaitem) === -1) majaitems.push(majaitem);
				}
				
				closestIntersect = intersect;
				closestIntersect.seg = all[i];
			}
		}

		if (!closestIntersect) continue;
		closestIntersect.angle = angle;

		intersects.push(closestIntersect);
	}
	
	intersects = intersects.sort(function(a,b){
		return a.angle-b.angle;
	});
	
	if (_id('showlights').checked) {
		ctx.beginPath();
		ctx.moveTo(intersects[0].x,intersects[0].y);
		for (var i=1;i<intersects.length;i++) {
			var intersect = intersects[i];
			ctx.lineTo(intersect.x,intersect.y);
		}
		ctx.fill();
	}
	
	if (_id('showpositions').checked) {
		ctx.beginPath();
		ctx.fillStyle = '#ffffff';
		points.forEach(function(ppp) {
			var text = ppp.x + '-' + ppp.y;
			var textWidth = ctx.measureText(ppp.x + ', ' + ppp.y).width;
			ctx.fillText(
				text,
				Math.min(Math.max(0, ppp.x - textWidth / 2), w - textWidth - 5),
				Math.min(Math.max(10, ppp.y                ), h)
			);
		});
	}

	if (_id('showlightwalls').checked) {
		ctx.beginPath();
		ctx.strokeStyle = 'lime';
		ctx.lineWidth = 1;
		ctx.moveTo(intersects[0].x,intersects[0].y);
		var laster = intersects[0];
		var nonnans = [0];
		
		for (var i = 1, il = intersects.length; i < il; i++) {
			if (Number.isNaN(intersects[i].x)) {
				// console.log('nan', intersects[i].x, intersects[i].y, intersects[i].seg);
				continue;
			}
			
			if (intersects[i].seg !== intersects[nonnans[nonnans.length - 1]].seg) {
				// console.log('moveto', intersects[i].x, intersects[i].y, intersects[i].seg);
				ctx.moveTo(fixCoordX(intersects[i].x), fixCoordY(intersects[i].y));
				var laster = intersects[i];
			} else {
				while (intersects[i + 1] && intersects[i + 1].seg === intersects[i].seg) {
					// console.log('skip', intersects[i].x, intersects[i].y, intersects[i].seg);
					++i;
				}
				
				if (laster.seg === intersects[i].seg) {
					// console.log('lineto', intersects[i].x, intersects[i].y, intersects[i].seg);
					ctx.lineTo(fixCoordX(intersects[i].x), fixCoordY(intersects[i].y));
					if (majaitems.indexOf(intersects[i].seg) !== -1) majaitems.splice(majaitems.indexOf(intersects[i].seg), 1);
				} else {
					// ???
				}
			}
			
			nonnans.push(i);
		}

		--i;

		if (intersects[i].seg === intersects[0].seg) {
			ctx.moveTo(fixCoordX(intersects[i].x), fixCoordY(intersects[i].y));
			ctx.lineTo(fixCoordX(intersects[0].x), fixCoordY(intersects[0].y));
		}
		ctx.stroke();
		
		ctx.beginPath();
		ctx.strokeStyle = 'orange';
		collinears.forEach(function(item) {
			ctx.moveTo(item[0], item[1]);
			ctx.lineTo(item[2], item[3]);
		});

		ctx.stroke();
	}
};

canvas.addEventListener('mousemove', runner);

function collinear(x1, y1, x2, y2, x3, y3) {
	var tolerance = Math.max(x1, x2, x3, y1, y2, y3) * 0.000001;
	return Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)) < tolerance;
}

function fixCoord(n) {
	return Math.max(Math.round(n), 1);
}

function fixCoordX(n) {
	return Math.min(fixCoord(n), w - 1);
}

function fixCoordY(n) {
	return Math.min(fixCoord(n), h - 1);
}

function getIntersection(seg1x1, seg1y1, seg1x2, seg1y2, seg2x1, seg2y1, seg2x2, seg2y2) {
	var ray = {
		a: { x: seg1x1, y: seg1y1 },
		b: { x: seg1x2, y: seg1y2 }
	};
	var segment = {
		a: { x: seg2x1, y: seg2y1 },
		b: { x: seg2x2, y: seg2y2 }
	};

	var r_px = ray.a.x;
	var r_py = ray.a.y;
	var r_dx = ray.b.x-ray.a.x;
	var r_dy = ray.b.y-ray.a.y;

	var s_px = segment.a.x;
	var s_py = segment.a.y;
	var s_dx = segment.b.x-segment.a.x;
	var s_dy = segment.b.y-segment.a.y;

	var r_mag = Math.sqrt(r_dx*r_dx+r_dy*r_dy);
	var s_mag = Math.sqrt(s_dx*s_dx+s_dy*s_dy);
	if(r_dx/r_mag==s_dx/s_mag && r_dy/r_mag==s_dy/s_mag){
		return null;
	}

	var T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx);
	var T1 = (s_px+s_dx*T2-r_px)/r_dx;

	if(T1<0) return null;
	if(T2<0 || T2>1) return null;

	return {
		x: r_px+r_dx*T1,
		y: r_py+r_dy*T1,
		param: T1
	};
}
