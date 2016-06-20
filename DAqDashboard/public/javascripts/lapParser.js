var splitLaps;

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

function toGridSquare(param1, param2) {
	var lat=-100.0;
	var lon=0.0;
	var adjLat,adjLon,GLat,GLon,nLat,nLon,gLat,gLon,rLat,rLon;
	var U = 'ABCDEFGHIJKLMNOPQRSTUVWX'
	var L = U.toLowerCase();
  // support Chris Veness 2002-2012 LatLon library and
  // other objects with lat/lon properties
  // properties could be numbers, or strings
  function toNum(x) {
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

function processLaps() {
	lap = 0;
	temp = [];
	splitLaps = [];
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
	
	//TODO: maybe should show error message that track info doesn't exist?
	if (track == null) {return}
	
	i = 0;
	p1 = new point(track.x1, track.y1);
	p2 = new point(track.x2, track.y2);
	p3 = new point(data[i].gpsLon, data[i].gpsLat);
	p4 = new point(data[i+1].gpsLon, data[i+1].gpsLat);
	
	// first lap does not count (warm up lap)
	while (i < data.length - 2 & !isIntersect(p1, p2, p3, p4)) {
		i++;
		p3 = new point(data[i].gpsLon, data[i].gpsLat);
		p4 = new point(data[i+1].gpsLon, data[i+1].gpsLat);
	}
// 		console.log("Lap 0: " + (data[i].time - data[0].time)/1000);
	while (i < data.length - 2) {
		i++;
		p3 = new point(data[i].gpsLon, data[i].gpsLat);
		p4 = new point(data[i+1].gpsLon, data[i+1].gpsLat);
		temp.push(data[i]);
		temp[temp.length - 1].lapTime = data[i].time - temp[0].time;
		if (isIntersect(p1, p2, p3, p4)) {
			splitLaps[lap] = temp;
			lap++;
// 				console.log("lap " + lap + ": " + (temp[temp.length - 1].time - temp[0].time)/1000);
			temp = [];
		}
	}
// 		console.log("lap " + (lap + 1) + ": " + (temp[temp.length - 1].time - temp[0].time)/1000);
// 		console.log("total time: " + (data[data.length - 1].time - data[0].time)/1000);
}