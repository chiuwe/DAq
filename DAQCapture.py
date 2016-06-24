import obd
import time
import csv
import smbus
import sys
import MMA8451 as mma
import gps
import RPi.GPIO as GPIO
from datetime import datetime

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
DIP_IO = [13, 16, 19]
PL_MASK = 0b11
PL_BITS = 2
BAFRO = 0b100000
BAFRO_THRES = 0.5
DEBUG = False

# Global Variables
connection = None
accel = None
session = None
transform = None

def debug(str):
	if DEBUG:
		print str
		
def setupDipSwitch():
	GPIO.setmode(GPIO.BCM)
	for x in DIP_IO:
		GPIO.setup(x, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# Direction of accelerometer
# Front 				Down (getOrientation())
# 0 Front			Front
# 1 Back				Back
# 2 Up				PU
# 3 Right			PD
# 4 Down				LR
# 5 Left				LL
def setupDataOrientation():
	key = 0
	dipSetBits = 0
	bitShift = 0
	mmaOr = accel.getOrientation()
	x, y, z = accel.readScaledData()
	
	debug("mmaOr: " + bin(mmaOr))
	debug("(" + str(x) + ", " + str(y) + ", " + str(z) + ")")
	for i in DIP_IO:
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
		print "key not found: " + bin(key)
		transform = lambda x, y, z: (-y, z, -x)


# https://github.com/brendan-w/python-OBD/issues/31
def initConnection():
	global connection
	while True:
		try:
			debug("connecting...")	
			connection = obd.Async()
			debug("connected")
			if len(connection.supported_commands) >= MAX_SUPPORTED_COMMANDS:
				debug("passed")
# 				connection.watch(obd.commands.ENGINE_LOAD)
# 				debug("ENGINE_LOAD")
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
# 				connection.watch(obd.commands.TIMING_ADVANCE)
# 				debug("TIMING_ADVANCE")
				connection.start()
				debug("OBD watchdog started!")
				break
			connection.close()
			time.sleep(1)
		except (KeyboardInterrupt, SystemExit):
			raise
		except:
			pass

def logData():
	filename = time.strftime("%Y%m%d%H%M.csv")
	gpsTime = gpsSpeed = gpsLat = gpsLon = gpsAlt = gpsClimb = None
	
	debug(filename)
	
	with open(filename, 'w') as csvfile:
		fieldnames = ['time', 'coolantTemp', 'rpm', 'speed', 'intakeTemp', 'maf', 'throttlePos', 'xG', 'yG', 'zG', 'orientation', 'gpsTime', 'gpsSpeed', 'gpsLat', 'gpsLon', 'gpsAlt', 'gpsClimb']
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		writer.writeheader()
		
		rpm = connection.query(obd.commands.RPM).value
		while rpm == None or rpm == 0.0:
			rpm = connection.query(obd.commands.RPM).value
			time.sleep(1)
		
		debug("Start logging data.")
		while rpm > 0:
			report = session.next()
			while report['class'] != 'TPV':
				report = session.next()
			if report['class'] == 'TPV':
				if hasattr(report, 'time'):
					gpsTime = report.time
				if hasattr(report, 'speed'):
					gpsSpeed = report.speed * gps.MPS_TO_MPH
				if hasattr(report, 'lat'):
					gpsLat = report.lat
				if hasattr(report, 'lon'):
					gpsLon = report.lon
				if hasattr(report, 'alt'):
					gpsAlt = report.alt
				if hasattr(report, 'climb'):
					gpsClimb = report.climb * gps.MPS_TO_MPH
			timestamp = datetime.now().strftime("%X.%f")
			x, y, z = accel.readScaledData()
			x, y, z = transform(x, y, z)
			rpm = connection.query(obd.commands.RPM).value
			writer.writerow(
				{'time': timestamp,
# 				'engineLoad': connection.query(obd.commands.ENGINE_LOAD).value,
				'coolantTemp': connection.query(obd.commands.COOLANT_TEMP).value,
				'rpm': rpm,
				'speed': (connection.query(obd.commands.SPEED).value * KPH_TO_MPH),
				'intakeTemp': connection.query(obd.commands.INTAKE_TEMP).value,
				'maf': connection.query(obd.commands.MAF).value,
				'throttlePos': connection.query(obd.commands.THROTTLE_POS).value,
# 				'timingAdvance' : connection.query(obd.commands.TIMING_ADVANCE).value,
				'xG' : x,
				'yG' : y,
				'zG' : z,
				'gpsTime' : gpsTime,
				'gpsSpeed' : gpsSpeed,
				'gpsLon' : gpsLon,
				'gpsLat' : gpsLat,
				'gpsAlt' : gpsAlt,
				'gpsClimb' : gpsClimb})
			time.sleep(0.1)
	
	debug("Exiting logging data.")
	connection.stop()
	connection.close()
		
if __name__ == "__main__":
	
	setupDipSwitch()
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
	for i in range(3):
		session.next()
	
	while True:
		initConnection()
		logData()
