import smbus

CTRL_REG1 = 0x2A
CTRL_REG2 = 0x2B
WHO_AM_I = 0x0D
XYZ_DATA_CFG = 0x0E

I2C_ADDRESS = 0x1D

class MMA8451:
	revision = ([l[12:-1] for l in open('/proc/cpuinfo','r').readlines() if l[:8]=="Revision"]+['0000'])[0]
	bus = smbus.SMBus(1 if int(revision, 16) >= 4 else 0)
	
	def __init__(self):
		
# bool Adafruit_MMA8451::begin(uint8_t i2caddr) {
#   Wire.begin();
#   _i2caddr = i2caddr;
# 
#   /* Check connection */
#   uint8_t deviceid = readRegister8(MMA8451_REG_WHOAMI);
#   if (deviceid != 0x1A)
#   {
#     /* No MMA8451 detected ... return false */
#     //Serial.println(deviceid, HEX);
#     return false;
#   }
# 
#   writeRegister8(MMA8451_REG_CTRL_REG2, 0x40); // reset
# 
#   while (readRegister8(MMA8451_REG_CTRL_REG2) & 0x40);
# 
#   // enable 4G range
#   writeRegister8(MMA8451_REG_XYZ_DATA_CFG, MMA8451_RANGE_4_G);
#   // High res
#   writeRegister8(MMA8451_REG_CTRL_REG2, 0x02);
#   // DRDY on INT1
#   writeRegister8(MMA8451_REG_CTRL_REG4, 0x01);
#   writeRegister8(MMA8451_REG_CTRL_REG5, 0x01);
# 
#   // Turn on orientation config
#   writeRegister8(MMA8451_REG_PL_CFG, 0x40);
# 
#   // Activate at max rate, low noise mode
#   writeRegister8(MMA8451_REG_CTRL_REG1, 0x01 | 0x04);
# 
#   /*
#   for (uint8_t i=0; i<0x30; i++) {
#     Serial.print("$");
#     Serial.print(i, HEX); Serial.print(" = 0x");
#     Serial.println(readRegister8(i), HEX);
#   }
#   */
# 
#   return true;
# }