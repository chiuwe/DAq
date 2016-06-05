import obd
import time
import csv
import smbus
from datetime import datetime

MAX_SUPPORTED_COMMANDS = 52
KPH_TO_MPH = 0.621371
connection = None

def init_connection():
	global connection
	while True:
		try:
			connection = obd.Async()
			print "connected"
			if len(connection.supported_commands) >= MAX_SUPPORTED_COMMANDS:
				print "passed"
				connection.watch(obd.commands.ENGINE_LOAD)
				print "ENGINE_LOAD"
				connection.watch(obd.commands.COOLANT_TEMP)
				print "COOLANT_TEMP"
				connection.watch(obd.commands.RPM)
				print "RPM"
				connection.watch(obd.commands.SPEED)
				print "SPEED"
				connection.watch(obd.commands.INTAKE_TEMP)
				print "INTAKE_TEMP"
				connection.watch(obd.commands.MAF)
				print "MAF"
				connection.watch(obd.commands.THROTTLE_POS)
				print "THROTTLE_POS"
# 				connection.watch(obd.commands.OIL_TEMP)
# 				print "OIL_TEMP"
# 				connection.watch(obd.commands.FUEL_RATE)
# 				print "FUEL_RATE"
				connection.start()
				print "OBD watchdog started!"
				break
			connection.close()
			time.sleep(1)
		except (KeyboardInterrupt, SystemExit):
			raise
		except:
			pass

def log_data():
	filename = time.strftime("%Y%m%d%H%M.csv")
	
	print filename
	
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
				'throttle_pos': connection.query(obd.commands.THROTTLE_POS).value,
# 				'oil_temp': connection.query(obd.commands.OIL_TEMP).value,
# 				'fuel_rate': connection.query(obd.commands.FUEL_RATE).value
				})
			time.sleep(0.1)
	
	connection.stop()
	connection.close()
		
if __name__ == "__main__":
	
	print "hello world!"
	while True:
		init_connection()
		log_data()
# what do i name each file thats created?
# timestamp of when it first successfully connected. use GPS to get relative position racetrack name if possible.


# how do i know when to start and stop logging?
# it should auto start, when obd.status() is lost, stop logging and close write file if needed, go back to searching.

# 04 ENGINE_LOAD
# 05 COOLANT_TEMP
# 0C RPM
# 0D SPEED
# 0F INTAKE_TEMP
# 10 MAF
# 11 THROTTLE_POS
# 5C OIL_TEMP

# with open('names.csv', 'w') as csvfile:
#     fieldnames = ['first_name', 'last_name']
#     writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
# 
#     writer.writeheader()
#     writer.writerow({'first_name': 'Baked', 'last_name': 'Beans'})
#     writer.writerow({'first_name': 'Lovely', 'last_name': 'Spam'})
#     writer.writerow({'first_name': 'Wonderful', 'last_name': 'Spam'})