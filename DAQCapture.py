import obd
import time
import csv
import smbus
import MMA8451 as mma
import gps
from datetime import datetime

MAX_SUPPORTED_COMMANDS = 52
KPH_TO_MPH = 0.621371
DEBUG = True

connection = None
accel = None
session = None

def debug(str):
	if DEBUG:
		print str

def initConnection():
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
	
	debug(filename)
	
	with open(filename, 'w') as csvfile:
		fieldnames = ['time', 'engineLoad', 'coolantTemp', 'rpm', 'speed', 'intakeTemp', 'maf', 'throttlePos', 'xG', 'yG', 'zG', 'gpsSpeed', 'gpsLat', 'gpsLon', 'gpsAlt', 'gpsClimb']
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		writer.writeheader()
		
		rpm = connection.query(obd.commands.RPM).value
		while rpm == None or rpm == 0.0:
			rpm = connection.query(obd.commands.RPM).value
			time.sleep(1)
		
		debug("Start logging data.")
		while rpm > 0:
			timestamp = datetime.now().strftime("%X.%f")
			x, y, z = accel.readData()
			rpm = connection.query(obd.commands.RPM).value
			report = session.next()
			if report['class'] == 'TPV':
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
			writer.writerow(
				{'time': timestamp,
				'engineLoad': connection.query(obd.commands.ENGINE_LOAD).value,
				'coolantTemp': connection.query(obd.commands.COOLANT_TEMP).value,
				'rpm': rpm,
				'speed': (connection.query(obd.commands.SPEED).value * KPH_TO_MPH),
				'intakeTemp': connection.query(obd.commands.INTAKE_TEMP).value,
				'maf': connection.query(obd.commands.MAF).value,
				'throttlePos': connection.query(obd.commands.THROTTLE_POS).value,
				'xG' : x,
				'yG' : y,
				'zG' : z,
				'gpsSpeed' : gpsSpeed,
				'gpsLat' : gpsLat,
				'gpsLon' : gpsLon,
				'gpsAlt' : gpsAlt,
				'gpsClimb' : gpsClimb})
			time.sleep(0.1)
	
	debug("Exiting logging data.")
	connection.stop()
	connection.close()
		
if __name__ == "__main__":

	global accel
	global session
	
	accel = mma.MMA8451()
	ismma = accel.check8451()
	if ismma:
		debug("MMA Found!")
	else:
		debug("No MMA Found.")
	accel.setup()
	
	session = gps.gps("localhost", "2947")
	session.stream(gps.WATCH_ENABLE | gps.WATCH_NEWSTYLE)
	
	while True:
		initConnection()
		logData()
