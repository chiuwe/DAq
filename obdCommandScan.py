import obd

while True:
	try:
		connection = obd.OBD()
		if len(connection.supported_commands) >= 52:
			break
	except (KeyboardInterrupt, SystemExit):
		raise
	except:
		pass

for i in range(96):
	if connection.supports(obd.commands[1][i]):
		print obd.commands[1][i].name

# <obd.OBDCommand.OBDCommand instance at 0x769a0918>
# <obd.OBDCommand.OBDCommand instance at 0x769a0940>
# <obd.OBDCommand.OBDCommand instance at 0x769a08c8>
# <obd.OBDCommand.OBDCommand instance at 0x769a08f0>
# <obd.OBDCommand.OBDCommand instance at 0x769a0968>
# <obd.OBDCommand.OBDCommand instance at 0x769a0990>
# <obd.OBDCommand.OBDCommand instance at 0x769a0a08>
# <obd.OBDCommand.OBDCommand instance at 0x769a0a30>
# <obd.OBDCommand.OBDCommand instance at 0x768e5c88>
# <obd.OBDCommand.OBDCommand instance at 0x768ebb70>
# <obd.OBDCommand.OBDCommand instance at 0x768e58a0>
# <obd.OBDCommand.OBDCommand instance at 0x768ebaf8>
# <obd.OBDCommand.OBDCommand instance at 0x768ebb48>
# <obd.OBDCommand.OBDCommand instance at 0x768ebb20>
# <obd.OBDCommand.OBDCommand instance at 0x769a0aa8>
# <obd.OBDCommand.OBDCommand instance at 0x768e5738>
# <obd.OBDCommand.OBDCommand instance at 0x768e5760>
# <obd.OBDCommand.OBDCommand instance at 0x768e5698>
# <obd.OBDCommand.OBDCommand instance at 0x768e56e8>
# <obd.OBDCommand.OBDCommand instance at 0x768e5648>
# <obd.OBDCommand.OBDCommand instance at 0x768e55a8>
# <obd.OBDCommand.OBDCommand instance at 0x769a0878>
# <obd.OBDCommand.OBDCommand instance at 0x769a0850>
# <obd.OBDCommand.OBDCommand instance at 0x769a08a0>
# <obd.OBDCommand.OBDCommand instance at 0x768e5788>
# <obd.OBDCommand.OBDCommand instance at 0x768e57b0>
# <obd.OBDCommand.OBDCommand instance at 0x768e59b8>
# <obd.OBDCommand.OBDCommand instance at 0x768e58f0>
# <obd.OBDCommand.OBDCommand instance at 0x768e5940>
# <obd.OBDCommand.OBDCommand instance at 0x769a07b0>
# <obd.OBDCommand.OBDCommand instance at 0x769a0788>
# <obd.OBDCommand.OBDCommand instance at 0x769a0b70>
# <obd.OBDCommand.OBDCommand instance at 0x769a0b48>
# <obd.OBDCommand.OBDCommand instance at 0x769a0710>
# <obd.OBDCommand.OBDCommand instance at 0x769a06e8>
# <obd.OBDCommand.OBDCommand instance at 0x769a0760>
# <obd.OBDCommand.OBDCommand instance at 0x769a0738>
# <obd.OBDCommand.OBDCommand instance at 0x769a0670>
# <obd.OBDCommand.OBDCommand instance at 0x769a0648>
# <obd.OBDCommand.OBDCommand instance at 0x769a06c0>
# <obd.OBDCommand.OBDCommand instance at 0x768e5b48>
# <obd.OBDCommand.OBDCommand instance at 0x768e5dc8>
# <obd.OBDCommand.OBDCommand instance at 0x768e5df0>
# <obd.OBDCommand.OBDCommand instance at 0x768ebb98>
# <obd.OBDCommand.OBDCommand instance at 0x768e5a58>
# <obd.OBDCommand.OBDCommand instance at 0x768e5a30>
# <obd.OBDCommand.OBDCommand instance at 0x768e5af8>
# <obd.OBDCommand.OBDCommand instance at 0x768e5aa8>
# <obd.OBDCommand.OBDCommand instance at 0x768e5b70>
# <obd.OBDCommand.OBDCommand instance at 0x769a0828>
# <obd.OBDCommand.OBDCommand instance at 0x768e5c10>
# <obd.OBDCommand.OBDCommand instance at 0x768e5be8>