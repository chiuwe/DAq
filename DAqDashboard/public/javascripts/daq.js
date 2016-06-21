var Colors = [
	"#D91E18",
	"#F89406",
	"#336E7B",
	"#26A65B",
	"#446CB3",
	"#1F3A93",
	"#663399",
	"#666"
];
var DataPoints = {
	ENGINELOAD: {
		type: "engineLoad",
		name: "Engine Load",
		unit: "%"
	},
	COOLANTTEMP: {
		type: "coolantTemp",
		name: "Coolant Temperature",
		unit: "°C"
	},
	RPM: {
		type: "rpm", 
		name: "RPM", 
		unit: "rpm"
	},
	OBDSPEED: {
		type: "speed",
		name: "OBD Speed",
		unit: "mph"
	},
	INTAKETEMP: {
		type: "intakeTemp",
		name: "Intake Temperature",
		unit: "°C"
	},
	MAF: {
		type: "maf",
		name: "MAF",
		unit: "grams/sec"
	},
	THROTTLEPOS: {
		type: "throttlePos",
		name: "Throttle Position",
		unit: "%"
	},
	TIMINGADV: {
		type: "timingAdvance",
		name: "Timing Advance",
		unit: "° before TDC"
	},
	XG: {
		type: "xG",
		name: "X-axis G-force",
		unit: "G"
	},
	YG: {
		type: "yG",
		name: "Y-axis G-force",
		unit: "G"
	},
	ZG: {
		type: "zG",
		name: "Z-axis G-force",
		unit: "G"
	},
	GPSSPEED: {
		type: "gpsSpeed",
		name: "GPS Speed",
		unit: "mph"
	},
	LATITUDE: {
		type: "gpsLat",
		name: "Latitude",
		unit: "°"
	},
	LONGITUDE: {
		type: "gpsLon",
		name: "Longitude",
		unit: "°"
	},
	ALTITUDE: {
		type: "gpsAlt",
		name: "Altitude",
		unit: "Unknown"
	},
	CLIMB: {
		type: "gpsClimb",
		name: "Climb",
		unit: "Unknown"
	}
}
var timeFormat = d3.time.format("%H:%M:%S.%L");
var geo = {
	type: "LineString",
	coordinates: []
};
var splitGeo = [];
var data;
var splitLaps;

function getSelectedValue() {
	var file = document.getElementById("files").value;
	return "/csv/" + file;
}

function render() {
	var file = getSelectedValue();
	d3.select("sidebar").selectAll("*").remove();
	d3.selectAll("svg").remove();
	d3.csv(file)
		.row(function(d) {
			geo.coordinates.push([+d.gpsLon, +d.gpsLat]);
			return {
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
}

// processLaps() HELPERS ======================================================

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
			lon = (typeof(param1.longitude)==='function')? toNum(param1.longitude()): toNum(param1.longitude);
			lat = (typeof(param1.latitude)==='function')? toNum(param1.latitude()): toNum(param1.latitude);
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

	var track;

function processLaps() {
	lap = 0;
	temp = [];
	splitLaps = [];
	splitGeo = [{
		type: "LineString",
		coordinates: []
	}];
	i = 0;
	
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
		splitGeo[lap].coordinates.push([data[x].gpsLon, data[x].gpsLat]);
		temp.push(data[x])
		if (isIntersect(p1, p2, p3, p4)) {
			splitLaps[lap] = temp;
			lap++;
			temp = [];
			splitGeo[lap] = {
				type: "LineString",
				coordinates: []
			};
		}
	}
	splitLaps[lap] = temp;
}

function processData() {
	var params = {
		width: 900,
		height: 200,
		margins: {
			top: 20,
			right: 20,
			bottom: 5,
			left: 60
		},
		tooltip: true,
		relativeTime: true
	};

	// var engineLoadGraph = new LineChart(params, data, DataPoints.ENGINELOAD);

	// var coolantTempGraph = new LineChart(params, data, DataPoints.COOLANTTEMP);

	var lapLegend = d3.select("sidebar").append("ul")
		.attr("class", "legend");
	for (x in splitLaps) {
		lapLegend.append("li")
			.style("background-color", Colors[x])
			.text("Lap "+(+x+1));
	}
	var gpsParams = {
		width: 375,
		height: 375,
		margins: {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		},
		tooltip: true
	}
	var gpsChart = new GPSChart(track, gpsParams, splitLaps, splitGeo);	

	var engineLoadGraph = new MultiLineChart(params, splitLaps, DataPoints.ENGINELOAD);
	var coolantTempGraph = new MultiLineChart(params, splitLaps, DataPoints.COOLANTTEMP);
	var rpmGraph = new MultiLineChart(params, splitLaps, DataPoints.RPM);
	var obdSpeedGraph = new MultiLineChart(params, splitLaps, DataPoints.OBDSPEED);
	var intakeTempGraph = new MultiLineChart(params, splitLaps, DataPoints.INTAKETEMP);
	var mafGraph = new MultiLineChart(params, splitLaps, DataPoints.MAF);
	var throttlePosGraph = new MultiLineChart(params, splitLaps, DataPoints.THROTTLEPOS);
	var timingAdvanceGraph = new MultiLineChart(params, splitLaps, DataPoints.TIMINGADV); 
}

render();