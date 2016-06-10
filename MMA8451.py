import smbus
import time

CTRL_REG1 		= 0x2A
CTRL_REG2 		= 0x2B
PL_STATUS		= 0x10
PL_CFG			= 0x11
XYZ_DATA_CFG 	= 0x0E
WHO_AM_I 		= 0x0D
MMA_DEVICEID 	= 0x1A
OFF_X				= 0x2F
OFF_Y				= 0x30
OFF_Z				= 0x31
ADDR				= 0x1D

DEFAULT_MASK	= 8
DATA_BIT_SIZE	= 14

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

def intToTwos(val, bits = DEFAULT_MASK):
	mask = 2**bits - 1
	if val < 0:
		val = (abs(val) ^ mask) + 1
	return val

def twosToInt(val, bits = DATA_BIT_SIZE):
    if (val & (1 << (bits - 1))) != 0: # if sign bit is set e.g., 8bit: 128-255
        val = val - (1 << bits)        # compute negative value
    return val                         # return positive value as is

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
		
	def setup(self, dataRange = RANGE_2_G):
		
		# reset
		self.bus.write_byte_data(ADDR, CTRL_REG2, 0x40)
		
		time.sleep(0.1)
		while self.bus.read_byte_data(ADDR, CTRL_REG2) & 0x40:
			pass
		
		# turn on orientation config
		self.bus.write_byte_data(ADDR, PL_CFG, 0x40)
		# set data range
		self.bus.write_byte_data(ADDR, XYZ_DATA_CFG, dataRange)
		# High resolution
		self.bus.write_byte_data(ADDR, CTRL_REG2, 0x02)
		# active and low noise mode
		self.bus.write_byte_data(ADDR, CTRL_REG1, 0x01 | 0x04)
		
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
		x = twosToInt(x)
		x = x / self.divider
		
		y = self.bus.read_byte_data(ADDR, OUT_Y_MSB) << 8
		y = (y | self.bus.read_byte_data(ADDR, OUT_Y_LSB)) >> 2
		y = twosToInt(y)
		y = y / self.divider
		
		z = self.bus.read_byte_data(ADDR, OUT_Z_MSB) << 8
		z = (z | self.bus.read_byte_data(ADDR, OUT_Z_LSB)) >> 2
		z = twosToInt(z)
		z = z / self.divider
		
		return x, y, z
	
	def getOrientation(self):
		return self.bus.read_byte_data(ADDR, PL_STATUS) & 0x07
		
	def zeroAxes(self):
		sampleX = sampleY = sampleZ = 0
		for x in range(10):
			x, y, z = self.readData()
			sampleX += x
			sampleY += y
			sampleZ += z
			time.sleep(0.01)
		# average and converts to milliGs
		aveX = int(sampleX * 100)
		aveY = int(sampleY * 100)
		aveZ = int(sampleZ * 100)
		
		print "(" + str(aveX) + ", " + str(aveY) + ", " + str(aveZ) + ")"
		
		self.bus.write_byte_data(ADDR, OFF_X, intToTwos(aveX))
		self.bus.write_byte_data(ADDR, OFF_Y, intToTwos(aveY))
		self.bus.write_byte_data(ADDR, OFF_Z, intToTwos(aveZ))
		
		time.sleep(0.1)
		
		print(self.bus.read_byte_data(ADDR, OFF_X))
		print(self.bus.read_byte_data(ADDR, OFF_Y))
		print(self.bus.read_byte_data(ADDR, OFF_Z))
	
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
		print accel.getOrientation()
		time.sleep(0.1)
