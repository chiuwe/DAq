function getSelectedValue() {
	var file = document.getElementById("files").value;
	return "/csv/" + file;
}

function CCW(p1, p2, p3) {
  a = p1.lon; b = p1.lat; 
  c = p2.lon; d = p2.lat;
  e = p3.lon; f = p3.lat;
  return (f - b) * (c - a) > (d - b) * (e - a);
}

function isIntersect(p1, p2, p3, p4) {
  return (CCW(p1, p3, p4) != CCW(p2, p3, p4)) && (CCW(p1, p2, p3) != CCW(p1, p2, p4));
}

function point(lon, lat) {
  this.lon = lon;
  this.lat = lat;
}

function toGridSquare(param1,param2){
	var lat=-100.0;
	var lon=0.0;
	var adjLat,adjLon,GLat,GLon,nLat,nLon,gLat,gLon,rLat,rLon;
	var U = 'ABCDEFGHIJKLMNOPQRSTUVWX'
	var L = U.toLowerCase();
  // support Chris Veness 2002-2012 LatLon library and
  // other objects with lat/lon properties
  // properties could be numbers, or strings
  function toNum(x){
    if (typeof(x) === 'number') return x;
    if (typeof(x) === 'string') return parseFloat(x);
    // dont call a function property here because of binding issue
    throw "HamGridSquare -- toNum -- can not convert input: "+x;
  }
  if (typeof(param1)==='object'){
    if (param1.length === 2){
      lat = toNum(param1[0]);
      lon = toNum(param1[1]);
    } else if (('lat' in param1) && ('lon' in param1)){
      lat = (typeof(param1.lat)==='function')? toNum(param1.lat()): toNum(param1.lat);
      lon = (typeof(param1.lon)==='function')? toNum(param1.lon()): toNum(param1.lon);
    } else if (('latitude' in param1) && ('longitude' in param1)){
      lat = (typeof(param1.latitude)==='function')? toNum(param1.latitude()): toNum(param1.latitude);
      lon = (typeof(param1.longitude)==='function')? toNum(param1.longitude()): toNum(param1.longitude);
    } else {
      throw "HamGridSquare -- can not convert object -- "+param1;
    }
  } else {
    lat = toNum(param1);
    lon = toNum(param2);
  }
  if (isNaN(lat)) throw "lat is NaN";
  if (isNaN(lon)) throw "lon is NaN";
  if (Math.abs(lat) === 90.0) throw "grid squares invalid at N/S poles";
  if (Math.abs(lat) > 90) throw "invalid latitude: "+lat;
  if (Math.abs(lon) > 180) throw "invalid longitude: "+lon;
  adjLat = lat + 90;
  adjLon = lon + 180;
  GLat = U[Math.trunc(adjLat/10)];
  GLon = U[Math.trunc(adjLon/20)];
  nLat = ''+Math.trunc(adjLat % 10);
  nLon = ''+Math.trunc((adjLon/2) % 10);
  rLat = (adjLat - Math.trunc(adjLat)) * 60;
  rLon = (adjLon - 2*Math.trunc(adjLon/2)) *60;
  gLat = L[Math.trunc(rLat/2.5)];
  gLon = L[Math.trunc(rLon/5)];
  return GLon+GLat+nLon+nLat+gLon+gLat;
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
var data2;
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
			processLaps();
			processData();
		});

	function processLaps() {
		lap = 0;
		temp = [];
		data2 = [];
		i = 0;
		var track;
		
		// find track
		while(track == null && i < data.length) {
			square = toGridSquare(data[i].gpsLat, data[i].gpsLon);
			j = 0;
			while(track == null && j < trackInfo.length) {
				if (trackInfo[j].gridSQ.includes(square)) {
					track = trackInfo[j];
				}
				j++;
			}
			i++;
		}
		
		// maybe should show error message that track info doesn't exist?
		if (track == null) {return}
		
		p1 = new point(track.x1, track.y1);
		p2 = new point(track.x2, track.y2);
		for (x = 0; x < data.length - 1; x++) {
			p3 = new point(data[x].gpsLon, data[x].gpsLat);
			p4 = new point(data[x+1].gpsLon, data[x+1].gpsLat);
			temp.push(data[x])
			if (isIntersect(p1, p2, p3, p4)) {
				data2[lap] = temp;
				lap++;
				temp = [];
			}
		}
	}

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