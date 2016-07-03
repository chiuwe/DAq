# DAq

DAq uses a Raspberry Pi 3 and various sensors to collect car performance data.

The data points collected are:

- Engine load (%)
- Coolant temperature (&deg;C)
- RPM (RPM)
- Speed (MPH)
- Intake temperature (&deg;C)
- MAF (grams/sec)
- Throttle position (%)
- Timing advance (&deg; before TDC)
- Acceleration (Gs)
- GPS position

## Hardware Components

- Raspberry Pi 3
- MMA8451 Accelerometer (I2C)
- Ultimate GPS Breakout V3 (miniUART)
- OBDII ELM327 (Bluetooth)

## Raspberry Pi 3 Setup

### Additional Packages

```
# OBD python library
sudo pip install obd

# I2C support
sudo apt-get install python-smbus

# GPS support
sudo apt-get install gpsd gpsd-clients python-gps
```

### Changes to `sudo raspi-config`:

- Enable I2C
- Enable Serial

### Add the following lines to `/etc/rc.local`:

```
# Needed to connect bluetooth to serial port
# 00:1D:A5:00:17:08 is the MAC address of the OBDII bluetooth device
# & is needed to fork this call because it doesn't return (blocking call)
sudo rfcomm bind rfcomm0 00:1D:A5:00:17:08 &

# Setting up I2C
sudo chmod 666 /sys/module/i2c_bcm2708/parameters/combined
sudo echo -n 1 > /sys/module/i2c_bcm2708/parameters/combined
```

### GPS Setup

Remove reference of `serial0` from `/boot/cmdline.txt`:
```
dwc_otg.lpm_enable=0 console=serial0,1152 console=tty1 root=/dev/mmcblk0p2 rootfstype=ext4 elevator=deadline fsck.repair=yes rootwait
```
to:
```
dwc_otg.lpm_enable=0 console=tty1 root=/dev/mmcblk0p2 rootfstype=ext4 elevator=deadline fsck.repair=yes rootwait
```

edit `/etc/default/gpsd`:
```
START_DAEMON="true"
USBAUTO="false"
DEVICES="/dev/ttyS0"
GPSD_OPTIONS="-n -G"
```

Reboot Pi:
```
sudo reboot
```

If your GPS has a fix then running `cgps -s` should result in some GPS relate data.

for older Pi's please refer to link for setup:
<https://learn.adafruit.com/adafruit-ultimate-gps-hat-for-raspberry-pi/pi-setup>
