/*
graph types
- line
- polar
graph components
- height
- width
- margins
- axis
	- x
	- y
- scale(domain, range)
- label
- plot(s)
*/

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
var parseTime = d3.timeParse("%H:%M:%S.%L");
var geo = {
	type: "LineString",
	coordinates: []
};
var data;

function getSelectedValue() {
	var file = document.getElementById("files").value;
	return "/csv/" + file;
}

function render() {
	var file = getSelectedValue();
	d3.select("sidebar").selectAll("*").remove();
	d3.select("main").selectAll("*").remove();

	d3.csv(file)
		.row(function(d) {
			geo.coordinates.push([+d.gpsLon, +d.gpsLat]);
			return {
				time: parseTime(d.time.replace(/(\.[0-9]{3})[0-9]*/, "$1")),
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
				gpsClimb: +d.gpsClimb
			};
		})
		.get(function (error, rows) {
			if (error) throw error;
			data = rows;
			processLaps();
			processData();
		});
}

var margin = {
	top: 2,
	right: 10,
	bottom: 2,
	left: 10
};
var width = 960 - margin.left - margin.right;
var height = 65 - margin.top - margin.bottom;
var x = d3.scaleTime().range([0, width]);

function processData() {
	d3.select("h1").text("Test - " + track.name);
}

render();