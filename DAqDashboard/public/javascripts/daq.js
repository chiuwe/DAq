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
var data;
render();
function render() {
	var file = getSelectedValue();
	d3.selectAll("svg").remove();
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
		var params = {
			"width": 1000,
			"height": 200,
			"margins": {
				top: 20,
				right: 20,
				bottom: 20,
				left: 80
			}
		};
		var engineLoadGraph = new Chart(params, data, "engineLoad");
		engineLoadGraph.drawYLabel("Engine Load", "%");
		var coolantTempGraph = new Chart(params, data, "coolantTemp");
		coolantTempGraph.drawYLabel("Coolant Temperature", "°C");
	}
}

function generateYAxis(dataPoint) {
	var maxDomain = d3.max(data, function(d) { return d[dataPoint]});
	var minDomain = d3.min(data, function(d) { return d[dataPoint]});
	return d3.scale.linear().domain([minDomain, maxDomain]).range([height - MARGINS.top, MARGINS.bottom]);
}