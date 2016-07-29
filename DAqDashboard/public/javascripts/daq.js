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

function processData() {
	d3.select("h1").text("DAq Dashboard - " + track.name);

	var lapLegend = d3.select("sidebar").append("ul")
		.attr("class", "legend");
	for (x in splitLaps) {
		lapLegend.append("li")
			.style("background-color", Colors[x])
			.text("Lap "+(+x+1));
	}
	var gpsParams = {
		width: 350,
		height: 350,
		margins: {
			top: 20,
			right: 20,
			bottom: 20,
			left: 20
		},
		tooltip: true
	}
	var gpsChart = new GPSChart(track, gpsParams, splitLaps, splitGeo);	
	var gForceChart = new GForceChart(gpsParams, splitLaps);

	var params = {
		width: 900,
		height: 150,
		margins: {
			top: 20,
			right: 20,
			bottom: 5,
			left: 60
		},
		tooltip: true,
		relativeTime: true
	};

	var dataLegend = d3.select("main").append("ul")
		.attr("class", "legend");
	dataLegend.append("li").text(DataPoints.ENGINELOAD.name);
	dataLegend.append("li").text(DataPoints.COOLANTTEMP.name);
	dataLegend.append("li").text(DataPoints.RPM.name);
	dataLegend.append("li").text(DataPoints.OBDSPEED.name);
	dataLegend.append("li").text(DataPoints.INTAKETEMP.name);
	dataLegend.append("li").text(DataPoints.MAF.name);
	dataLegend.append("li").text(DataPoints.THROTTLEPOS.name);
	dataLegend.append("li").text(DataPoints.TIMINGADV.name);

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