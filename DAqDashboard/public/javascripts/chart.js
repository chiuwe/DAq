function Chart(params, data, dataPoint) {
	// Setup
	this.data = data;
	this.dataPoint = dataPoint;
	this.HEIGHT = params.height;
	this.WIDTH = params.width;
	this.MARGINS = params.margins;
	this.xScale = this.generateXScale("time");
	this.xScale.tickFormat(d3.time.format("%H:%M:%S.%L"));
	this.xAxis = d3.svg.axis().scale(this.xScale);
	this.yScale = this.generateYScale(dataPoint);
	this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");

	// Create SVG objects
	this.svg = d3.select("main").append("svg")
		.attr("width", this.WIDTH + this.MARGINS.left + this.MARGINS.right)
		.attr("height", this.HEIGHT + this.MARGINS.top + this.MARGINS.bottom);
	// X-axis
	this.svg.append("svg:g")
			.attr('stroke-width', 1)
			.attr('transform', 'translate(0,' + (this.HEIGHT - this.MARGINS.bottom) + ')')
			.call(this.xAxis);
	this.svg.append("text")
		.attr("x", this.WIDTH / 2)
		.attr("y", this.HEIGHT + this.MARGINS.bottom)
		.style("text-anchor", "middle")
		.text("Time");
	// Y-axis
	this.svg.append("svg:g")
			.attr('transform', 'translate(' + this.MARGINS.left + ',0)')
			.call(this.yAxis);
	// Plot
	var lineFunc = this.generateLineFunction();
	var line = this.svg.append('svg:path')
		.attr('d', lineFunc(this.data))
		.attr("class", "line");

	// tooltip
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

Chart.prototype.generateLineFunction = function() {
	var self = this;
	return d3.svg.line()
		.x(function(d) {
			return self.xScale(d["time"]);
		})
		.y(function(d) {
			return self.yScale(d[self.dataPoint]);
		});
};

Chart.prototype.drawYLabel = function(name, unit) {
	this.svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("x", 0 - (this.HEIGHT / 2))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text(name + " (" + unit + ")");
};

Chart.prototype.bisectTime = d3.bisector(function(d) { return d.time; }).left;
Chart.prototype.mouseMove = function(svgObj) {
	var xPos = this.xScale.invert(d3.mouse(svgObj)[0]);
	var i = this.bisectTime(this.data, xPos);
	var d0 = this.data[i-1];
	var d1 = this.data[i];
	var d = xPos - d0.time > d1.time - xPos ? d1: d0;
	this.tooltip.attr("transform", "translate(" + this.xScale(d.time) + "," + this.yScale(d[this.dataPoint]) + ")");
	this.tooltip.select("text").text(d[this.dataPoint]);
}