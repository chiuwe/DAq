# DAq

DAq uses a Raspberry Pi 3 and various sensors to collect car performance data.

The data points collected are:

- Engine load
- Coolant temperature
- RPM
- Speed
- Intake temperature
- MAF
- Throttle position
- Timing advance
- Acceleration
- GPS position

## Hardware Components

- Raspberry Pi 3
- MMA8451 Accelerometer (I2C)
- Ultimate GPS Breakout V3 (miniUART)
- OBDII ELM327 (Bluetooth)

## Changes in `/etc/rc.local`

Added the following:

```
# Needed to connect bluetooth to serial port
# 00:1D:A5:00:17:08 is the MAC address of the OBDII bluetooth device
# & is needed to fork this call because it doesn't return (blocking call)
sudo rfcomm bind rfcomm0 00:1D:A5:00:17:08 &

# Setting up I2C
sudo chmod 666 /sys/module/i2c_bcm2708/parameters/combined
sudo echo -n 1 > /sys/module/i2c_bcm2708/parameters/combined
```
