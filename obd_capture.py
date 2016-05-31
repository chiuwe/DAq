import obd
import time
import csv
import smbus
from datetime import datetime

MAX_SUPPORTED_COMMANDS = 7

connection = None

# select the correct i2c bus for this revision of Raspberry Pi
revision = ([l[12:-1] for l in open('/proc/cpuinfo','r').readlines() if l[:8]=="Revision"]+['0000'])[0]
bus = smbus.SMBus(1 if int(revision, 16) >= 4 else 0)

def init_connection():
	global connection
	while True:
		try:
			connection = obd.OBD()
			if connection.supported_commands >= MAX_SUPPORTED_COMMANDS:
				connection.watch(obd.commands.ENGINE_LOAD)
				connection.watch(obd.commands.COOLANT_TEMP)
				connection.watch(obd.commands.RPM)
				connection.watch(obd.commands.SPEED)
				connection.watch(obd.commands.INTAKE_TEMP)
				connection.watch(obd.commnads.MAF)
				connection.watch(obd.commands.THROTTLE_POS)
				connection.watch(obd.commands.OIL_TEMP)
				connection.watch(obd.commands.FUEL_RATE)
				connection.start()
				break
			connection.close()
			time.sleep(1)
		except:
			pass

def log_data():
	filename = time.strftime("%Y%m%d%H%M.csv")

	with open(filename, 'w') as csvfile:
		fieldname = ['time', 'engine_load', 'coolant_temp', 'rpm', 'speed', 'intake_temp', 'maf', 'throttle_pos', 'oil_temp', 'fuel_rate']
		writer = csv.DictWriter(csvfile. fieldnames=fieldnames)
	
		writer.writeheader()
		while connection.is_connected():
			time = datetime.now().strftime("%X.%f")
			writer.writerow(
				{'time': time,
				'engine_load': connection.query(obd.commands.ENGINE_LOAD),
				'coolant_temp': connection.query(obd.commands.COOLANT_TEMP),
				'rpm': connection.query(obd.commands.RPM),
				'speed': connection.query(obd.commands.SPEED),
				'intake_temp': connection.query(obd.commands.INTAKE_TEMP),
				'maf': connection.query(obd.commands.MAF),
				'throttle_pos': connection.query(obd.commands.THROTTLE_POS),
				'oil_temp': connection.query(obd.commands.OIL_TEMP)
				'fuel_rate': connection.query(obd.commands.FUEL_RATE)})
			time.sleep(0.01)
	
	connection.stop()
	connection.close()
		
if __name__ == "__main__":
	
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