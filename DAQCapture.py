import obd
import time
import csv
import gps
import sys
import logging
import smbus
import json
import MMA8451 as mma
import ToGrid as grid
import RPi.GPIO as GPIO
from datetime import datetime
from Point import Point

# Global Constants
ORIENTATION_MAPPING = {
	0b101010: lambda x, y, z: (x, y, z),
	0b101011: lambda x, y, z: (-x, y, -z),
	0b101000: lambda x, y, z: (-y, x, z),
	0b101001: lambda x, y, z: (y, x, -z),
	0b100110: lambda x, y, z: (-x, -y, z),
	0b100111: lambda x, y, z: (x, -y, -z),
	0b100100: lambda x, y, z: (y, -x, z),
	0b100101: lambda x, y, z: (-y, -x, -z),
	0b11100: lambda x, y, z: (-x, -z, -y),
	0b11101: lambda x, y, z: (x, -z, y),
	0b11110: lambda x, y, z: (-y, -z, x),
	0b11111: lambda x, y, z: (y, -z, -x),
	0b11000: lambda x, y, z: (x, z, -y),
	0b11001: lambda x, y, z: (-x, z, y),
	0b11010: lambda x, y, z: (y, z, x),
	0b11011: lambda x, y, z: (-y, z, -x),
	0b10110: lambda x, y, z: (-z, y, x),
	0b10111: lambda x, y, z: (z, y, -x),
	0b10000: lambda x, y, z: (z, x, -y),
	0b10001: lambda x, y, z: (-z, x, y),
	0b01110: lambda x, y, z: (z, -y, x),
	0b01111: lambda x, y, z: (-z, -y, x),
	0b01000: lambda x, y, z: (-z, -x, -y),
	0b01001: lambda x, y, z: (z, -x, y)
}

MAX_SUPPORTED_COMMANDS = 52
KPH_TO_MPH = 0.621371
DIP_PINS = [13, 16, 19]
LED_PINS = [5, 6]
PL_MASK = 0b11
PL_BITS = 2
BAFRO = 0b100000
BAFRO_THRES = 0.5
DEBUG = False
PWD = '/home/pi/DAq/'

# Global Variables
connection = None
accel = None
session = None
transform = None
start1 = None
start2 = None
point3 = None
point4 = None

def debug(str):
	if DEBUG:
		logging.debug(str)

def CCW(p1, p2, p3):
	return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x)

def isIntersect(p1, p2, p3, p4):
	return (CCW(p1, p3, p4) != CCW(p2, p3, p4)) and (CCW(p1, p2, p3) != CCW(p1, p2, p4))

def setupGPIO():
	GPIO.setmode(GPIO.BCM)
	for x in DIP_PINS:
		GPIO.setup(x, GPIO.IN, pull_up_down=GPIO.PUD_UP)
	for x in LED_PINS:
		GPIO.setup(x, GPIO.OUT)
		GPIO.output(x, 0)

def setupStartLine():
	gridSQ = curLat = curLon = None
	found = False
	
	with open(PWD + 'trackInfo.json') as trackInfoFile:
		trackInfoData = json.load(trackInfoFile)
	report = gpsNext()
	if report['class'] == 'TPV':
		if hasattr(report, 'lat'):
			curLat = report.lat
		if hasattr(report, 'lon'):
			curLon = report.lon
	gridSQ = grid.toGrid(curLat, curLon)
	
	for track in trackInfoData['trackInfo']:
		for square in track['gridSQ']:
			if square == gridSQ:
				found = True
		if found:
			start1 = Point(track['x1'], track['y1'])
			start2 = Point(track['x2'], track['x2'])
			debug(track['name'])
			break

# Direction of accelerometer
# Front 				Down (getOrientation())
# 0 Front				Front
# 1 Back				Back
# 2 Up					PU
# 3 Right				PD
# 4 Down				LR
# 5 Left				LL
def setupDataOrientation():
	global transform
	key = 0
	dipSetBits = 0
	bitShift = 0
	mmaOr = accel.getOrientation()
	x, y, z = accel.readScaledData()
	
	debug("mmaOr: " + bin(mmaOr))
	debug("(" + str(x) + ", " + str(y) + ", " + str(z) + ")")
	for i in DIP_PINS:
		dipSetBits = dipSetBits | (GPIO.input(i) << bitShift)
		bitShift += 1
	debug("dipSetBits: " + bin(dipSetBits))
	if abs(z) > BAFRO_THRES:
		debug("front/back")
		key = (dipSetBits << 1) | (mmaOr & 1) | BAFRO
	else:
		debug("PL")
		key = (dipSetBits << PL_BITS) | (mmaOr >> 1 & PL_MASK)
	debug("key: " + bin(key))
	transform = ORIENTATION_MAPPING.get(key)
	
	# Set to personal default if key not found	
	if transform == None:
		logging.warning("key not found: " + bin(key))
		transform = lambda x, y, z: (-y, z, -x)

def gpsNext():
	report = session.next()
	while report['class'] != 'TPV':
		report = session.next()
	
	return report

def connectOBD():
	global connection
	while True:
		try:
			connection = obd.Async()
			debug("connected")
			if len(connection.supported_commands) >= MAX_SUPPORTED_COMMANDS:
				debug("passed")
				connection.watch(obd.commands.ENGINE_LOAD)
				debug("ENGINE_LOAD")
				connection.watch(obd.commands.COOLANT_TEMP)
				debug("COOLANT_TEMP")
				connection.watch(obd.commands.RPM)
				debug("RPM")
				connection.watch(obd.commands.SPEED)
				debug("SPEED")
				connection.watch(obd.commands.INTAKE_TEMP)
				debug("INTAKE_TEMP")
				connection.watch(obd.commands.MAF)
				debug("MAF")
				connection.watch(obd.commands.THROTTLE_POS)
				debug("THROTTLE_POS")
				connection.watch(obd.commands.TIMING_ADVANCE)
				debug("TIMING_ADVANCE")
				connection.start()
				debug("OBD watchdog started!")
				GPIO.output(LED_PINS[0], 1)
				break
			connection.close()
			debug("waiting...")
			time.sleep(5)
		except (KeyboardInterrupt, SystemExit):
			GPIO.cleanup()
			raise
		except:
			pass

def disconnectOBD():
	GPIO.output(LED_PINS[1], 0)
	connection.stop()
	connection.close()
	GPIO.output(LED_PINS[0], 0)
	time.sleep(5)

def waitToCrossStartLine():
	x = y = None
	
	report = gpsNext()
	if report['class'] == 'TPV':
		if hasattr(report, 'lon'):
			x = report.lon
		if hasattr(report, 'lat'):
			y = report.lat
	point3 = point4 = Point(x, y)
	
	while not isIntersect(start1, start2, point3, point4):
		point3 = point4
		report = gpsNext()
		if report['class'] == 'TPV':
			if hasattr(report, 'lon'):
				x = report.lon
			if hasattr(report, 'lat'):
				y = report.lat
		point4 = Point(x, y)

def logData():
	gpsSpeed = gpsLat = gpsLon = gpsAlt = gpsClimb = None
	lap = 1
	
	report = session.next()
	while not hasattr(report, 'time'):
		report = session.next()
	filename = report['time'] + ".csv"
	
	debug(filename)
	
	with open(PWD + filename, 'w') as csvfile:
		fieldnames = ['time', 'lap', 'engineLoad', 'coolantTemp', 'rpm', 'speed', 'intakeTemp', 'maf', 'throttlePos', 'timingAdvance', 'xG', 'yG', 'zG', 'gpsSpeed', 'gpsLat', 'gpsLon', 'gpsAlt', 'gpsClimb']
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		writer.writeheader()
		
		rpm = connection.query(obd.commands.RPM).value
		while rpm == None or rpm == 0.0:
			rpm = connection.query(obd.commands.RPM).value
			time.sleep(1)
		
		debug("Start logging data.")
		GPIO.output(LED_PINS[1], 1)
		now = time.time()
		while rpm > 0:
			point3 = point4
			report = gpsNext()
			if report['class'] == 'TPV':
				if hasattr(report, 'speed'):
					gpsSpeed = report.speed * gps.MPS_TO_MPH
				if hasattr(report, 'lon'):
					gpsLon = report.lon
				if hasattr(report, 'lat'):
					gpsLat = report.lat
				if hasattr(report, 'alt'):
					gpsAlt = report.alt
				if hasattr(report, 'climb'):
					gpsClimb = report.climb * gps.MPS_TO_MPH
			x, y, z = accel.readScaledData()
			x, y, z = transform(x, y, z)
			rpm = connection.query(obd.commands.RPM).value
			point4 = Point(gpsLon, gpsLat)
			if isIntersect(start1, start2, point3, point4):
				lap = lap + 1
			writer.writerow(
				{'time': time.time() - now,
				'lap': lap,
				'engineLoad': connection.query(obd.commands.ENGINE_LOAD).value,
				'coolantTemp': connection.query(obd.commands.COOLANT_TEMP).value,
				'rpm': rpm,
				'speed': (connection.query(obd.commands.SPEED).value * KPH_TO_MPH),
				'intakeTemp': connection.query(obd.commands.INTAKE_TEMP).value,
				'maf': connection.query(obd.commands.MAF).value,
				'throttlePos': connection.query(obd.commands.THROTTLE_POS).value,
				'timingAdvance' : connection.query(obd.commands.TIMING_ADVANCE).value,
				'xG' : x,
				'yG' : y,
				'zG' : z,
				'gpsSpeed' : gpsSpeed,
				'gpsLon' : gpsLon,
				'gpsLat' : gpsLat,
				'gpsAlt' : gpsAlt,
				'gpsClimb' : gpsClimb})
			time.sleep(0.1)
	
	debug("Exiting logging data.")
	disconnectOBD()
		
if __name__ == "__main__":
	
	if len(sys.argv) == 2:
		DEBUG = sys.argv[1]
	
	setupGPIO()
	logging.basicConfig(level=logging.DEBUG,
								format='%(asctime)s %(levelname)-8s %(message)s',
								datefmt='%m-%d %H:%M',
								filename=PWD + "exception.log")
	
	accel = mma.MMA8451()
	ismma = accel.check8451()
	if ismma:
		debug("MMA Found!")
	else:
		debug("No MMA Found.")
	accel.setup()
 	time.sleep(0.1)
	setupDataOrientation()
	
	session = gps.gps("localhost", "2947")
	session.stream(gps.WATCH_ENABLE | gps.WATCH_NEWSTYLE)
	
	setupStartLine()
	
	while True:
		connectOBD()
		try:
			waitToCrossStartLine()
			logData()
		except:
			disconnectOBD()
			logging.exception("logData:")
