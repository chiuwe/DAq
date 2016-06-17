function Chart(params, data, dataPoint) {
	// Setup
	this.HEIGHT = params.height;
	this.WIDTH = params.width;
	this.MARGINS = params.margins;
	this.xScale = this.generateXScale(data, dataPoint);
	this.xScale.tickFormat(d3.time.format("%H:%M:%S.%L"));
	this.xAxis = d3.svg.axis().scale(this.xScale);
	this.yScale = this.generateYScale(data, dataPoint);
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
	var lineFunc = this.generateLineFunction(data, dataPoint, this.xScale, this.yScale);
	var line = this.svg.append('svg:path')
		.attr('d', lineFunc(data))
		.attr("class", "line");
	// TODO: this.tooltip;
};

Chart.prototype.generateXScale = function(data, dataPoint) {
	var minDomain = data[0].time;
	var maxDomain = data[data.length-1].time;
	return d3.time.scale().domain([minDomain, maxDomain]).range([this.MARGINS.left, this.WIDTH + this.MARGINS.left - this.MARGINS.right]);

};

Chart.prototype.generateYScale = function(data, dataPoint) {
	var minDomain = d3.min(data, function(d) { return d[dataPoint]});
	var maxDomain = d3.max(data, function(d) { return d[dataPoint]});
	return d3.scale.linear().domain([minDomain, maxDomain]).range([this.HEIGHT - this.MARGINS.top, this.MARGINS.bottom]);
};

Chart.prototype.generateLineFunction = function(data, dataPoint, xScale, yScale) {
	return d3.svg.line()
		.x(function(data) {
			return xScale(data["time"]);
		})
		.y(function(data) {
			return yScale(data[dataPoint]);
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