# DAq

Raspberry Pi 3 <br />
MMA8451 Accelerometer (I2C) <br />
Ultimate GPS Breakout V3 (miniUART) <br />
OBDII ELM327 (Bluetooth) <br />


/etc/rc.local
# needed to connect bluetooth to serial port?
sudo rfcomm bind rfcomm0 00:1D:A5:00:17:08 &

# setting up I2C
sudo chmod 666 /sys/module/i2c_bcm2708/parameters/combined <br />
sudo echo -n 1 > /sys/module/i2c_bcm2708/parameters/combined