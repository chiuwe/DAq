import smbus
import time

CTRL_REG1 		= 0x2A
CTRL_REG2 		= 0x2B
XYZ_DATA_CFG 	= 0x0E
WHO_AM_I 		= 0x0D
MMA_DEVICEID 	= 0x1A
ADDR			= 0x1D

OUT_X_MSB = 0x01
OUT_X_LSB = 0x02
OUT_Y_MSB = 0x03
OUT_Y_LSB = 0x04
OUT_Z_MSB = 0x05
OUT_Z_LSB = 0x06

# Range values
RANGE_8_G = 0b10    # +/- 8g
RANGE_4_G = 0b01    # +/- 4g
RANGE_2_G = 0b00    # +/- 2g (default value)

REVISION = ([l[12:-1] for l in open('/proc/cpuinfo','r').readlines() if l[:8]=="Revision"]+['0000'])[0]

class MMA8451:
	
	def __init__(self):
		self.bus = smbus.SMBus(1 if int(REVISION, 16) >= 4 else 0)
	
	def check8451(self):
		mma = True

		try:
			deviceID = self.bus.read_byte_data(ADDR, WHO_AM_I)
			if deviceID != MMA_DEVICEID:
				print "Wrong device found! Device ID = " + str(deviceID)
				mma = false
			else:
				"MMA8541 Detected!"
		except:
			print "MMA Device Not Connected!"
			mma = False

		return mma
		
	def setup(self, dataRange = Range_2_G):
		
		# reset
		bus.write_byte_data(ADDR, CTRL_REG2, 0x40)
		
		while bus.read_byte_data(ADDR, CTRL_REG2) & 0x40:
			pass
		
		# set data range
		bus.write_byte_data(ADDR, XYZ_DATA_CFG, dataRange)
		# High resolution
		bus.write_byte_data(ADDR, CTRL_REG2, 0x02)
		# active and low noise mode
		bus.write_byte_data(ADDR, CTRL_REG1, 0x01 | 0x04)
		
		mmaRange = self.bus.read_byte_data(ADDR, XYZ_DATA_CFG) & 0x03
		
		if (mmaRange == RANGE_8_G):
			self.divider = 1024.0
		elif (mmaRange == RANGE_4_G):
			self.divider = 2048.0
		elif (mmaRange == RANGE_2_G):
			self.divider = 4096.0
		else:
			self.divider = 1.0
			print "Invalid Data Range Found. Printing raw, uncalibrated values."

	
	def readData(self):
		x = self.bus.read_byte_data(ADDR, OUT_X_MSB) << 8
		x = (x | self.bus.read_byte_data(ADDR, OUT_X_LSB)) >> 2
		x = x / self.divider
		
		y = self.bus.read_byte_data(ADDR, OUT_Y_MSB) << 8
		y = (y | self.bus.read_byte_data(ADDR, OUT_Y_LSB)) >> 2
		y = y / self.divider
		
		z = self.bus.read_byte_data(ADDR, OUT_Z_MSB) << 8
		z = (z | self.bus.read_byte_data(ADDR, OUT_Z_LSB)) >> 2
		z = z / self.divider
		
		return x, y, z
	
if __name__ == '__main__':

	accel = MMA8451()
	
	ismma = accel.check8451()
	if ismma:
		print "MMA 8451 Found!"
	else:
		print "No MMA Found. What is this?!"
	
	accel.setup()
	
	while True:
		x, y, z = accel.readData()
		print "(" + str(x) + ", " + str(y) + ", " + str(z) + ")"
		time.sleep(0.1)