function getSelectedValue() {
	var file = document.getElementById("files").value;
	return "/csv/" + file;
}

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

		var engineLoadGraph = new Chart(params, data, DataPoints.ENGINELOAD.type);
		engineLoadGraph.drawYLabel(DataPoints.ENGINELOAD.name, DataPoints.ENGINELOAD.unit);
		
		var coolantTempGraph = new Chart(params, data, DataPoints.COOLANTTEMP.type);
		coolantTempGraph.drawYLabel(DataPoints.COOLANTTEMP.name, DataPoints.COOLANTTEMP.unit);
	}
}