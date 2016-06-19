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
	var minDomain = d3.min(data, function(d) { return d[dataPoint]});
	var maxDomain = d3.max(data, function(d) { return d[dataPoint]});
	return d3.time.scale().domain([minDomain, maxDomain]).range([this.MARGINS.left, this.WIDTH + this.MARGINS.left - this.MARGINS.right]);
};

Chart.prototype.generateYScale = function(dataPoint) {
	var minDomain = d3.min(data, function(d) { return d[dataPoint]});
	var maxDomain = d3.max(data, function(d) { return d[dataPoint]});
	return d3.scale.linear().domain([minDomain, maxDomain]).range([this.HEIGHT - this.MARGINS.top, this.MARGINS.bottom]);
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
	this.dataPoint = dataPoint;
	this.xScale = this.generateXScale("time");
	this.xScale.tickFormat(d3.time.format("%H:%M:%S.%L"));
	this.xAxis = d3.svg.axis().scale(this.xScale);
	this.yScale = this.generateYScale(this.dataPoint.type);
	this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");

	this.drawXAxis();
	this.drawYAxis();
	this.drawXLabel("Time");
	this.drawYLabel(this.dataPoint.name, this.dataPoint.unit);
	if (params.tooltip == true) {
		this.generateTooltip();		
	}
	this.drawPlot();
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
	return d3.svg.line()
		.x(function(d) {
			return self.xScale(d["time"]);
		})
		.y(function(d) {
			return self.yScale(d[self.dataPoint.type]);
		});
};

LineChart.prototype.drawPlot = function() {
	var lineFunc = this.generateLineFunction();
	var line = this.svg.append('svg:path')
		.attr('d', lineFunc(this.data))
		.attr("class", "line");
};

// GPS CHART ==================================================================

function GPSChart(params, data) {
	Chart.call(this, params, data, geo);

	this.geo = geo;
	
	// Create unit projection
	this.projection = d3.geo.mercator()
		.scale(1)
		.translate([0, 0]);
	// Create path
	this.path = d3.geo.path()
		.projection(this.projection);
	// Compute bounds
	var b = this.path.bounds(this.geo);
	this.scale = .95 / Math.max((b[1][0] - b[0][0]) / this.WIDTH, (b[1][1] - b[0][1]) / this.HEIGHT);
	this.translate = [(this.WIDTH - this.scale * (b[1][0] + b[0][0])) / 2, (this.HEIGHT - this.scale * (b[1][1] + b[0][1])) / 2];
	// Update projection
	this.projection
		.scale(this.scale)
		.translate(this.translate);

	// this.path = d3.geo.path(this.geo)
	// 	.projection(this.projection);

	// var lineFunc = this.generateLineFunction();
	// var line = this.svg.append('svg:path')
	// 	.attr('d', lineFunc(this.data))
		// .attr("class", "line");

	var ppath = this.svg.append("path")
		.datum(geo)
		.attr("d", this.path)
		.attr("class", "line")
		.call(transition);
	// console.log(ppath);
	// var self = this;
	// this.svg.selectAll("circle")
	// 	.data(this.data).enter()
	// 	.append("circle")
	// 	.attr("cx", function (d) { return self.projection([d["gpsLon"],d["gpsLat"]])[0]; })
	// 	.attr("cy", function (d) { return self.projection([d["gpsLon"],d["gpsLat"]])[1]; })
	// 	.attr("r", "3px")
	// 	.attr("fill", "red")

	this.marker = this.svg.append("circle")
		.attr("r", 3)
		.attr("fill", "red")
		.attr("id", "marker")
		.attr("transform", "translate("+this.projection(this.geo.coordinates[0])[0]+","+this.projection(this.geo.coordinates[0])[1]+")");
	function transition(path) {
		path.transition()
			.duration(30000)
			.attrTween("stroke", tweenDash);
	}
	function tweenDash() {
		var l = ppath.node().getTotalLength();
    	return function(t) {
	      var marker = d3.select("#marker");
	      var p = ppath.node().getPointAtLength(t * l);
	      marker.attr("transform", "translate(" + p.x + "," + p.y + ")");
	      return "black";
	    }
	}
}

GPSChart.prototype = Object.create(Chart.prototype);
GPSChart.prototype.generateLineFunction = function() {
	var self = this;
	return d3.svg.line()
		.x(function(d) {
			return self.projection([d["gpsLon"],d["gpsLat"]])[0];
		})
		.y(function(d) {
			return self.projection([d["gpsLon"],d["gpsLat"]])[1];
		});
};