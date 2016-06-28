// CHART ======================================================================

function Chart(params, data) {
	// Setup
	this.data = data;
	this.HEIGHT = params.height;
	this.WIDTH = params.width;
	this.MARGINS = params.margins;
	this.XMAX = 0;
	// this.svg = d3.select("main").append("svg")
	// 	.attr("width", this.WIDTH + this.MARGINS.left + this.MARGINS.right)
	// 	.attr("height", this.HEIGHT + this.MARGINS.top + this.MARGINS.bottom);
}

Chart.prototype.generateXScale = function(dataPoint) {
	var extent = d3.extent(this.data, function(d) { return d[dataPoint]; });
	this.XMAX = extent[1];
	return d3.time.scale().domain(extent).range([this.MARGINS.left, this.WIDTH + this.MARGINS.left - this.MARGINS.right]);
};

Chart.prototype.generateYScale = function(dataPoint) {
	var extent = d3.extent(this.data, function(d) { return d[dataPoint]; });
	return d3.scale.linear().domain(extent).range([this.HEIGHT - this.MARGINS.top, this.MARGINS.bottom]);
};

Chart.prototype.drawXLabel = function(name, unit) {
	labelText = name;
	if (unit) {
		labelText += " (" + unit + ")";
	}
	this.svg.append("text")
		.attr("x", this.WIDTH / 2)
		.attr("y", this.HEIGHT + this.MARGINS.bottom)
		.style("text-anchor", "middle")
		.text(labelText);
};

Chart.prototype.drawYLabel = function(name, unit) {
	labelText = name;
	if (unit) {
		labelText += " (" + unit + ")";
	}

	this.svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("x", 0 - (this.HEIGHT / 2))
		.attr("dy", "1em")
		.style("font-size", "0.8em")
		.style("text-anchor", "middle")
		.text(labelText);
};

Chart.prototype.generateTooltip = function() {
	var self = this;
	this.tooltip = this.svg.append("g")
		.attr("class", "tooltip")
		.style("display", "none");
	this.tooltip.append("circle")
		.attr("fill", "red")
		.attr("r", 3);
	this.tooltip.append("text")
		.attr("x", 7)
		.attr("dy", ".35em");
	this.svg.append("rect")
		.attr("class", "overlay")
		.attr("width", this.WIDTH + this.MARGINS.left + this.MARGINS.right)
		.attr("height", this.HEIGHT + this.MARGINS.top + this.MARGINS.bottom)
		.on("mouseover", function() { self.tooltip.style("display", null); })
		.on("mouseout", function() { self.tooltip.style("display", "none"); })
		.on("mousemove", function() { self.mouseMove(this); });
};

Chart.prototype.bisectTime = d3.bisector(function(d) { return d.time; }).left;

Chart.prototype.mouseMove = function(svgObj) {
	var xPos = this.xScale.invert(d3.mouse(svgObj)[0]);
	var i = this.bisectTime(this.data, xPos);
	var d0 = this.data[i-1];
	var d1 = this.data[i];
	var d = xPos - d0.time > d1.time - xPos ? d1: d0;
	this.tooltip.attr("transform", "translate(" + this.xScale(d.time) + "," + this.yScale(d[this.dataPoint.type]) + ")");
	this.tooltip.select("text").text(d[this.dataPoint.type]);
};

// LINE CHART =================================================================

function SingleLineChart(params, data, dataPoint) {
	Chart.call(this, params, data);

	this.svg = d3.select("main").append("svg")
		.attr("width", this.WIDTH + this.MARGINS.left + this.MARGINS.right)
		.attr("height", this.HEIGHT + this.MARGINS.top + this.MARGINS.bottom);
	this.params = params;
	this.dataPoint = dataPoint;
	if (params.relativeTime == true) {
		this.xScale = this.generateXScale("lapTime");
	} else {
		this.xScale = this.generateXScale("time");
	}
	this.xScale.tickFormat(d3.time.format("%M:%S.%L"));
	this.xAxis = d3.svg.axis().scale(this.xScale);
	this.yScale = this.generateYScale(this.dataPoint.type);
	this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");

	this.drawXAxis();
	this.drawYAxis();
	this.drawXLabel("Time");
	this.drawYLabel(this.dataPoint.name, this.dataPoint.unit);
	this.drawPlot();
	if (params.tooltip == true) {
		this.generateTooltip();		
	}
}

SingleLineChart.prototype = Object.create(Chart.prototype);

SingleLineChart.prototype.drawXAxis = function() {
	this.svg.append("svg:g")
			.attr('stroke-width', 1)
			.attr('transform', 'translate(0,' + (this.HEIGHT - this.MARGINS.bottom) + ')')
			.call(this.xAxis);
};

SingleLineChart.prototype.drawYAxis = function() {
	this.svg.append("svg:g")
			.attr('transform', 'translate(' + this.MARGINS.left + ',0)')
			.call(this.yAxis);
};

SingleLineChart.prototype.generateLineFunction = function() {
	var self = this;
	var x;
	if (this.params.relativeTime == true) {
		x = function(d) { return self.xScale(d["lapTime"]); };
	} else {
		x = function(d) { return self.xScale(d["time"]); };
	}
	return d3.svg.line()
		.x(x)
		.y(function(d) {
			return self.yScale(d[self.dataPoint.type]);
		});
};

SingleLineChart.prototype.drawPlot = function() {
	var lineFunc = this.generateLineFunction();
	var line = this.svg.append('svg:path')
		.attr('d', lineFunc(this.data))
		.attr("class", "line")
		.attr("stroke", "#333");
};

// MULTI-LINE CHART ===========================================================

function MultiLineChart(params, data, dataPoint) {
	Chart.call(this, params, data);

	this.svg = d3.select("main").append("svg")
		.attr("width", this.WIDTH + this.MARGINS.left + this.MARGINS.right)
		.attr("height", this.HEIGHT + this.MARGINS.top + this.MARGINS.bottom);
	this.params = params;
	this.dataPoint = dataPoint;
	if (params.relativeTime == true) {
		this.xScale = this.generateXScale("lapTime");
	} else {
		this.xScale = this.generateXScale("time");
	}
	this.xScale.tickFormat(d3.time.format("%M:%S.%L"));
	this.xAxis = d3.svg.axis().scale(this.xScale);
	this.yScale = this.generateYScale(this.dataPoint.type);
	this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");

	this.drawXAxis();
	this.drawYAxis();
	// this.drawXLabel("Time");
	this.drawYLabel(this.dataPoint.name, this.dataPoint.unit);

	this.plots = []
	for (x in this.data) {
		this.plots[x] = new LinePlot(this, this.data[x], x);
	}

	function LinePlot(parent, data, x) {
		var parent = parent;
		this.lineFunc = parent.generateLineFunction();
		this.line = parent.svg.append("path")
			.attr("d", this.lineFunc(data))
			.attr("class", "line")
			.attr("stroke", Colors[x]);
		return this.line
	}
}

MultiLineChart.prototype = Object.create(SingleLineChart.prototype);

MultiLineChart.prototype.generateXScale = function(dataPoint) {
	var maxDomain;
	var minDomain;
	for (x in this.data) {
		var tempMin = d3.min(this.data[x], function(d) { return d[dataPoint]; });
		var tempMax = d3.max(this.data[x], function(d) { return d[dataPoint]; });
		if (minDomain == undefined || tempMin < minDomain) { minDomain = tempMin; }
		if (maxDomain == undefined || tempMax > maxDomain) { maxDomain = tempMax; }
	}
	this.XMAX = maxDomain;
	return d3.time.scale().domain([minDomain, maxDomain]).range([this.MARGINS.left, this.WIDTH + this.MARGINS.left - this.MARGINS.right]);
};

MultiLineChart.prototype.generateYScale = function(dataPoint) {
	var maxDomain;
	var minDomain;
	for (x in this.data) {
		var tempMin = d3.min(this.data[x], function(d) { return d[dataPoint]; });
		var tempMax = d3.max(this.data[x], function(d) { return d[dataPoint]; });
		if (minDomain == undefined || tempMin < minDomain) { minDomain = tempMin; }
		if (maxDomain == undefined || tempMax > maxDomain) { maxDomain = tempMax; }
		console.log(dataPoint + "\t" + minDomain + "\t" + maxDomain);
	}
	return d3.scale.linear().domain([minDomain, maxDomain]).range([this.HEIGHT - this.MARGINS.top, this.MARGINS.bottom]);
};

// GPS CHART ==================================================================

function GPSChart(track, params, data, geo) {
	Chart.call(this, params, data);

	var self = this;
	this.svg = d3.select("sidebar").append("svg")
		.attr("width", this.WIDTH + this.MARGINS.left + this.MARGINS.right)
		.attr("height", this.HEIGHT + this.MARGINS.top + this.MARGINS.bottom);
	this.geo = geo;

	// Create unit projection
	this.projection = d3.geo.mercator()
		.scale(1)
		.translate([0, 0]);
	// Create path
	this.path = d3.geo.path()
		.projection(this.projection);
	// Compute bounds
	var b = this.path.bounds(this.geo[0]);
	this.scale = .95 / Math.max((b[1][0] - b[0][0]) / this.WIDTH, (b[1][1] - b[0][1]) / this.HEIGHT);
	this.translate = [(this.WIDTH - this.scale * (b[1][0] + b[0][0])) / 2, (this.HEIGHT - this.scale * (b[1][1] + b[0][1])) / 2];
	// Update projection
	this.projection
		.scale(this.scale)
		.translate(this.translate);

	// Draw track
	this.trackPath = this.svg.append("g");
	d3.json(track["geojson"], function(json) {
		self.trackPath.selectAll("path")
			.data(json.features)
			.enter()
				.append("svg:path")
					.attr("d", self.path)
					.attr("class", "track");
	});

	this.lapPaths = [];
	for (x in geo) {
		this.lapPaths[x] = new GPSLaps(this, data[x], geo[x], x);
	}

	function GPSLaps(parent, data, geo, x) {
		var self = this;

		// this.start = data[0].time;
		this.xMax = 0;
		for (i in data) {
			// var relativeTime = data[i].time - this.start;
			if (this.xMax < data[i].lapTime) {
				this.xMax = data[i].lapTime;
			}
		}

		// Path
		this.path = parent.svg.append("path")
			.datum(geo)
			.attr("d", parent.path);

		// Marker
		var startPoint = geo.coordinates[0];
		this.marker = parent.svg.append("g")
			.attr("transform", "translate("+parent.projection(startPoint)[0]+","+parent.projection(startPoint)[1]+")")
			.call(transition);

		// Marker label
		this.label = this.marker.append("text")
			.attr("x", 7)
			.attr("dy", ".35em")
			.text(+x+1);

		// Marker point
		this.point = this.marker.append("circle")
			.attr("r", 3)
			.attr("fill", Colors[x])
			.attr("id", "marker");

		function transition(point) {
			point.transition()
				.duration(self.xMax/10)
				.attrTween("transform", tweenDash);
		}

		function tweenDash() {
			var l = self.path.node().getTotalLength();
			return function(t) {
				var point = self.path.node().getPointAtLength(t * l);
				return "translate(" + point.x +"," + point.y + ")";
			};
		}
	}
}

GPSChart.prototype = Object.create(Chart.prototype);

// G-FORCE CHART ==============================================================

function GForceChart(params, data) {
	Chart.call(this, params, data);
	var self = this;

	this.svg = d3.select("sidebar").append("svg")
		.attr("width", this.WIDTH + this.MARGINS.left + this.MARGINS.right)
		.attr("height", this.HEIGHT + this.MARGINS.top + this.MARGINS.bottom)//;
		.append("g")
			.attr("transform", "translate("+((this.WIDTH/2)+this.MARGINS.left)+","+((this.HEIGHT/2)+this.MARGINS.top)+")");
	this.params = params;

	this.r = d3.scale.linear()
		.domain([0,2])
		.range([0, (this.WIDTH/2)]);
	this.rAxis = this.svg.append("g")
		.attr("class", "axis")
		.selectAll("g")
		.data(this.r.ticks(4).slice(0.5))
		.enter().append("g");
	this.rAxis.append("circle")
		.attr("r", this.r);
	this.rAxis.append("text")
		.attr("y", function(d) { return -self.r(d) - 3 })
		.attr("transform", "rotate(45)")
		.style("text-anchor", "middle")
		.text(function(d) { return d });

	this.aAxis = this.svg.append("g")
		.attr("class", "axis")
		.selectAll("g")
			.data(d3.range(0, 360, 90))
		.enter().append("g")
			.attr("transform", function(d) { return "rotate("+-d+")"; });
	this.aAxis.append("line")
		.attr("x2", this.WIDTH/2);

	this.line = d3.svg.line.radial()
		.radius(function(d) { return self.r(self.convertToPolarRadius(d[DataPoints.XG.type], d[DataPoints.YG.type])); })
		.angle(function(d) { return self.convertToPolarAngle(d[DataPoints.XG.type], d[DataPoints.YG.type]); });

	this.svg.append("path")
	    .datum(data[0])
	    .attr("class", "line")
	    .attr("d", this.line);

	 // this.plots = [];
	 for (x in data) {
	 	// this.svg.append("path")
		 //    .datum(data[x])
		 //    .attr("class", "line")
		 //    .attr("d", this.line)
			// .attr("stroke", Colors[x]);
		new Plot(this, data[x], x);
	 }

	// this.plots = [];
	// for (x in data) {
	// 	this.plots[x] = new LinePlot(this, data[x], x);
	// }

	// function LinePlot(parent, data, x) {
	// 	var parent = parent;
	// 	this.lineFunc = parent.generateLineFunction();
	// 	this.line = parent.svg.append("path")
	// 		.attr("d", this.lineFunc(data))
	// 		.attr("class", "line")
	// 		.attr("stroke", Colors[x]);
	// 	return this.line
	// }
	function Plot(parent, data, x) {
		var self = this;

		this.xMax = 0;
		for (i in data) {
			// var relativeTime = data[i].time - this.start;
			if (this.xMax < data[i].lapTime) {
				this.xMax = data[i].lapTime;
			}
		}

		// Path
	 	this.path = parent.svg.append("path")
		    .datum(data)
		    .attr("class", "line")
		    .attr("d", parent.line);
			// .attr("stroke", Colors[x]);

		// Marker
		// var startPoint = geo.coordinates[0];
		var radius = parent.r(parent.convertToPolarRadius(data[0].xG, data[0].yG));
		var angle = parent.convertToPolarAngle(data[0].xG, data[0].yG);
		var transform = d3.transform("translate("+radius+") rotate("+angle+")");
		console.log(this.path);
		this.marker = parent.svg.append("g")
			.attr("transform", "translate("+radius+") rotate("+angle+",0,0)")
			.call(transition);
			// .attr("transform", "translate("+radius+",0) rotateZ("+angle+"deg)");
			// .attr("transform", "rotate("+angle+")");
			// .attr("transform", "translate("+parent.projection(startPoint)[0]+","+parent.projection(startPoint)[1]+")")
		// 	.call(transition);

		// Marker label
		// this.label = this.marker.append("text")
		// 	.attr("x", 7)
		// 	.attr("dy", ".35em")
			// .text(+x+1);

		// Marker point
		this.point = this.marker.append("circle")
			.attr("r", 3)
			.attr("fill", Colors[x])
			.attr("id", "marker");

		function transition(point) {
			point.transition()
				.duration(self.xMax/10)
				// .duration(30000)
				.attrTween("transform", tweenDash);
		}

		function tweenDash() {
			var l = self.path.node().getTotalLength();
			return function(t) {
				var point = self.path.node().getPointAtLength(t * l);
				return "translate(" + point.x +"," + point.y + ")";
			};
		}
	}
}

GForceChart.prototype = Object.create(SingleLineChart.prototype);

GForceChart.prototype.generateLineFunction = function() {
	var self = this;
	return d3.svg.line()
		.x(function(d) {
			return self.xScale(d[DataPoints.XG.type])
		})
		.y(function(d) {
			return self.yScale(d[DataPoints.YG.type]);
		});
};

GForceChart.prototype.convertToPolarRadius = function(x, y) {

	console.log(x+"\t"+y+"\t"+Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
	return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
};

GForceChart.prototype.convertToPolarAngle = function(x, y) {
	var theta = Math.atan(y/x);
	// console.log(theta);
	var quadrant = this.getQuadrant(x, y);
	if (quadrant == 1) return theta;
	if (quadrant == 2) return 180 + theta;//Math.PI - theta;
	if (quadrant == 3) return 180 + theta;//Math.PI + theta;
	if (quadrant == 4) return 360 + theta;//2 * Math.PI - theta;
};

GForceChart.prototype.getQuadrant = function(x, y) {
	if ( x < 0 && y >= 0 ) return 2;
	if ( x < 0 && y < 0 ) return 3;
	if ( x >= 0 && y < 0 ) return 4;
	return 1;
};