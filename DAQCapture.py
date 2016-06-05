import obd
import time
import csv
import smbus
import MMA8451
import gps
from datetime import datetime

MAX_SUPPORTED_COMMANDS = 52
KPH_TO_MPH = 0.621371
DEBUG = False

connection = None

def debug(str):
	if DEBUG:
		print str

def init_connection():
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

def log_data():
	filename = time.strftime("%Y%m%d%H%M.csv")
	
	debug(filename)
	
	with open(filename, 'w') as csvfile:
		fieldnames = ['time', 'engine_load', 'coolant_temp', 'rpm', 'speed', 'intake_temp', 'maf', 'throttle_pos']
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		time.sleep(5)
		writer.writeheader()
		while connection.is_connected():
			timestamp = datetime.now().strftime("%X.%f")
			writer.writerow(
				{'time': timestamp,
				'engine_load': connection.query(obd.commands.ENGINE_LOAD).value,
				'coolant_temp': connection.query(obd.commands.COOLANT_TEMP).value,
				'rpm': connection.query(obd.commands.RPM).value,
				'speed': (connection.query(obd.commands.SPEED).value * KPH_TO_MPH),
				'intake_temp': connection.query(obd.commands.INTAKE_TEMP).value,
				'maf': connection.query(obd.commands.MAF).value,
				'throttle_pos': connection.query(obd.commands.THROTTLE_POS).value})
			time.sleep(0.1)
	
	connection.stop()
	connection.close()
		
if __name__ == "__main__":

	while True:
		init_connection()
		log_data()
