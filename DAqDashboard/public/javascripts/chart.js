var Colors = [
	"#D91E18",
	"#663399",
	"#446CB3",
	"#336E7B",
	"#1F3A93",
	"#26A65B",
	"#F89406"
];

// CHART ======================================================================

function Chart(params, data) {
	// Setup
	this.data = data;
	this.HEIGHT = params.height;
	this.WIDTH = params.width;
	this.MARGINS = params.margins;
	this.svg = d3.select("main").append("svg")
		.attr("width", this.WIDTH + this.MARGINS.left + this.MARGINS.right)
		.attr("height", this.HEIGHT + this.MARGINS.top + this.MARGINS.bottom);
}

Chart.prototype.generateXScale = function(dataPoint) {
	var extent = d3.extent(this.data, function(d) { return d[dataPoint]; });
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

function LineChart(params, data, dataPoint) {
	Chart.call(this, params, data);
	this.params = params;
	this.dataPoint = dataPoint;
	if (params.relativeTime == true) {
		var start = data[0].time;
		for (x in data) {
			data[x].relativeTime = data[x].time.getTime() - start.getTime();
		}
		this.xScale = this.generateXScale("relativeTime");
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

LineChart.prototype = Object.create(Chart.prototype);

LineChart.prototype.drawXAxis = function() {
	this.svg.append("svg:g")
			.attr('stroke-width', 1)
			.attr('transform', 'translate(0,' + (this.HEIGHT - this.MARGINS.bottom) + ')')
			.call(this.xAxis);
};

LineChart.prototype.drawYAxis = function() {
	this.svg.append("svg:g")
			.attr('transform', 'translate(' + this.MARGINS.left + ',0)')
			.call(this.yAxis);
};

LineChart.prototype.generateLineFunction = function() {
	var self = this;
	var x;
	if (this.params.relativeTime == true) {
		x = function(d) { return self.xScale(d["relativeTime"]); };
	} else {
		x = function(d) { return self.xScale(d["time"]); };
	}
	return d3.svg.line()
		.x(x)
		.y(function(d) {
			return self.yScale(d[self.dataPoint.type]);
		});
};

LineChart.prototype.drawPlot = function() {
	var lineFunc = this.generateLineFunction();
	var line = this.svg.append('svg:path')
		.attr('d', lineFunc(this.data))
		.attr("class", "line")
		.attr("stroke", "#333");
};

// GPS CHART ==================================================================

function GPSChart(track, params, data, geo) {
	Chart.call(this, params, data);

	this.geo = geo;
	var self = this;

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

		// Path
		this.path = parent.svg.append("path")
			.datum(geo)
			.attr("d", parent.path);

		// Marker
		var startPoint = geo.coordinates[0];
		this.marker = parent.svg.append("g")
			.attr("transform", "translate("+parent.projection(startPoint)[0]+","+parent.projection(startPoint)[1]+")")
			.call(transition);
		this.point = this.marker.append("circle")
			.attr("r", 3)
			.attr("fill", Colors[x])
			.attr("id", "marker");

		function transition(point) {
			point.transition()
				.duration(30000)
				.attrTween("transform", tweenDash);
		}

		function tweenDash() {
			var l = self.path.node().getTotalLength();
			return function(t) {
				var point = self.path.node().getPointAtLength(t * l);
				return "translate(" + point.x +"," + point.y + ")";
			};
		}

		// Label
		this.label = this.marker.append("text")
			.attr("x", 7)
			.attr("dy", ".35em")
			.text(x);
	}
}

GPSChart.prototype = Object.create(Chart.prototype);