function getSelectedValue() {
	var file = document.getElementById("files").value;
	return "/csv/" + file;
}

var dataPoints = [
	{type: "engineLoad", name: "Engine Load", unit: "%"},
	{type: "coolantTemp", name: "Coolant Temp", unit: "°C"},
	{type: "rpm", name: "RPM", unit: "rpm"},
	{type: "speed", name: "Speed", unit: "mph"},
	{type: "intakeTemp", name: "Intake Temperature", unit: "°C"},
	{type: "maf", name: "MAF", unit: "grams/sec"},
	{type: "throttlePos", name: "Throttle Position", unit: "%"},
	{type: "timingAdvance", name: "Timing Advance", unts: "° before TDC"},
	//{type: "xG", name: "X-axis G-force", unit: "G"},
	//{type: "yG", name: "Y-axis G-force", unit: "G"},
	{type: "zG", name: "Z-axis G-force", unit: "G"},
	{type: "gpsSpeed", name: "GPS Speed", unit: "mph"},
	{type: "gpsLat", name: "Latitude", unit: "°"},
	{type: "gpsLon", name: "Longitude", unit: "°"},
	{type: "gpsAlt", name: "Altitude", unit: "Unknown"},
	{type: "gpsClimb", name: "Climb", unit: "Unknown"}
];
var timeFormat = d3.time.format("%H:%M:%S.%L");
var width = 1000;
var height = 200;
var MARGINS = {
	top: 20,
	right: 20,
	bottom: 20,
	left: 80
};
var data;
render();
function render() {
var file = getSelectedValue();
d3.selectAll("svg").remove();
//console.log(file);
d3.csv(file)
	.row(function(d) {return {
		time: timeFormat.parse(d.time.replace(/(\.[0-9]{3})[0-9]*/, "$1")),
		engineLoad: +d.engineLoad,
		coolantTemp: +d.coolantTemp,
		rpm: +d.rpm,
		speed: +d.speed,
		intakeTemp: +d.intakeTemp,
		maf: +d.maf,
		throttlePos: +d.throttlePos,
		timingAdvance: +d.timingAdvance,
		xG: +d.xG,
		yG: +d.yG,
		zG: +d.zG,
		gpsSpeed: +d.gpsSpeed,
		gpsLat: +d.gpsLat,
		gpsLon: +d.gpsLon,
		gpsAlt: +d.gpsAlt,
		gpsClimb: +d.gpsClimb};
	})
	.get(function(error, rows) {
		data = rows;
		processData();
	});

function processData() {
	for (x in dataPoints) {
		var svg = d3.select("main").append("svg")
			.attr("width", width + MARGINS.left + MARGINS.right)
			.attr("height", height + MARGINS.top + MARGINS.bottom);

		// X-axis
		var xScale = d3.time.scale().domain([data[0].time, data[data.length-1].time]).range([MARGINS.left, width + MARGINS.left - MARGINS.right]);
		xScale.tickFormat(d3.time.format("%H:%M:%S.%L"));
		var xAxis = d3.svg.axis().scale(xScale).ticks(6);
		svg.append("text")
			.attr("x", width / 2)
			.attr("y", height + MARGINS.bottom)
			.style("text-anchor", "middle")
			.text("Time");
		svg.append("svg:g")
			.attr('stroke-width', 1)
			.attr('transform', 'translate(0,' + (height - MARGINS.bottom) + ')')
			.call(xAxis);

		// Y-axis
		var yScale = generateYAxis(dataPoints[x].type);
		var yAxis = d3.svg.axis().scale(yScale).orient("left");
		svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("x", 0 - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text(dataPoints[x].name + " (" + dataPoints[x].unit + ")");
		svg.append("svg:g")
			.attr('transform', 'translate(' + MARGINS.left + ',0)')
			.call(yAxis);

		// Line
		var lineFunc = d3.svg.line()
			.x(function(d) {
				return xScale(d["time"]);
			})
			.y(function(d) {
				return yScale(d[dataPoints[x].type]);
			});
		var line = svg.append('svg:path')
			.attr('d', lineFunc(data))
			.attr("class", "line");
	}

	// G-force graph
	var gForce = d3.select("main").append("svg")
		.attr("width", 500)
		.attr("height", 500);
	var xScale = d3.scale.linear().domain([-2,2]).range([0,500]);
	var xAxis = d3.svg.axis().scale(xScale).ticks(10);
	gForce.append("svg:g")
		.attr('stroke-width', 1)
		.attr('transform', 'translate(0,250)')
		.call(xAxis);
	var yScale = d3.scale.linear().domain([-2,2]).range([500,0]);
	var yAxis = d3.svg.axis().scale(yScale).orient("left");
	gForce.append("svg:g")
		.attr('transform', 'translate(250,0)')
		.call(yAxis);
	var lineFunc = d3.svg.line()
		.x(function(d) {
			return xScale(d["xG"]);
			})
		.y(function(d) {
			return yScale(d["yG"]);
		});
	gForce.append("svg:path")
		.attr("d", lineFunc(data))
		.attr("stroke", "blue")
		.attr("stroke-width", 1)
		.attr("fill", "none");
	
	// OBD Speed vs GPS Speed
	var svg = d3.select("main").append("svg")
		.attr("width", width + MARGINS.left + MARGINS.right)
		.attr("height", height + MARGINS.top + MARGINS.bottom);

	// X-axis
	var xScale = d3.time.scale().domain([data[0].time, data[data.length-1].time]).range([MARGINS.left, width + MARGINS.left - MARGINS.right]);
	xScale.tickFormat(d3.time.format("%H:%M:%S.%L"));
	var xAxis = d3.svg.axis().scale(xScale).ticks(6);
	svg.append("text")
		.attr("x", width / 2)
		.attr("y", height + MARGINS.bottom)
		.style("text-anchor", "middle")
		.text("Time");
	svg.append("svg:g")
		.attr('stroke-width', 1)
		.attr('transform', 'translate(0,' + (height - MARGINS.bottom) + ')')
		.call(xAxis);

	// Y-axis
	var yScale = generateYAxis('speed');
	var yAxis = d3.svg.axis().scale(yScale).orient("left");
	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("x", 0 - (height / 2))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("OBD vs GPS Speed (mph)");
	svg.append("svg:g")
		.attr('transform', 'translate(' + MARGINS.left + ',0)')
		.call(yAxis);

	// OBD Speed Line
	var OBDLineFunc = d3.svg.line()
		.x(function(d) {
			return xScale(d["time"]);
		})
		.y(function(d) {
			return yScale(d['speed']);
		});
	var OBDLine = svg.append('svg:path')
		.attr('d', OBDLineFunc(data))
		.attr("class", "line");
	
	// GPS Speed Line
	var gpsLineFunc = d3.svg.line()
		.x(function(d) {
			return xScale(d["time"]);
		})
		.y(function(d) {
			return yScale(d['gpsSpeed']);
		});
	var gpsLine = svg.append('svg:path')
		.attr('d', gpsLineFunc(data))
		.attr("class", "line blue");
	
	// Tooltip
	var tooltip = svg.append("g")
		.attr("class", "tooltip")
		.style("display", "none");
	tooltip.append("circle")
		.attr("fill", "red")
		.attr("r", 3);
	tooltip.append("text")
		.attr("x", 7)
		.attr("dy", ".35em");
	svg.append("rect")
		.attr("class", "overlay")
		.attr("width", width + MARGINS.left + MARGINS.right)
		.attr("height", height + MARGINS.top + MARGINS.bottom)
		.on("mouseover", function() { tooltip.style("display", null); })
		.on("mouseout", function () { tooltip.style("display", "none"); })
		.on("mousemove", mousemove);
	
	var bisectTime = d3.bisector(function(d) { return d.time}).left;
	function mousemove() {
		var xPos = xScale.invert(d3.mouse(this)[0]);
		var i = bisectTime(data, xPos);
		var d0 = data[i-1];
		var d1 = data[i];
		var d = xPos - d0.time > d1.time - xPos ? d1 : d0;
		tooltip.attr("transform", "translate(" + xScale(d.time) + "," + yScale(d['gpsSpeed']) + ")");
		tooltip.select("text").text(d['gpsSpeed']);
	}
}
}

function generateYAxis(dataPoint) {
	var maxDomain = d3.max(data, function(d) { return d[dataPoint]});
	var minDomain = d3.min(data, function(d) { return d[dataPoint]});
	return d3.scale.linear().domain([minDomain, maxDomain]).range([height - MARGINS.top, MARGINS.bottom]);
}