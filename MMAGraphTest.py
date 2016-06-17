import MMA8451 as mma
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from collections import deque

# Plot Class
class AnalogPlot:
	# constructor
	def __init__(self, accel, maxLen):
		self.accel = accel
		self.maxLen = maxLen
		self.ax = deque([0.0] * maxLen)
		self.ay = deque([0.0] * maxLen)
		self.az = deque([0.0] * maxLen)
		
	# add to buffer
	def addToBuf(self, buf, val):
		if len(buf) < self.maxLen:
			buf.append(val)
		else:
			buf.pop()
			buf.appendleft(val)
	
	# add data
	def add(self, x, y, z):
		self.addToBuf(self.ax, x)
		self.addToBuf(self.ay, y)
		self.addToBuf(self.az, z)

	# update plot
	def update(self, frameNum, a0):
		x, y, z = self.accel.readScaledData()
		self.add(x, y, z)
		a0.set_data(self.ax, self.ay)
# 		a1.set_data(range(self.maxLen), self.ay)	

if __name__ == '__main__':
	mma = mma.MMA8451()
	mma.setup()
	analogPlot = AnalogPlot(mma, 10)
	fig = plt.figure()
	ax = plt.axes(xlim=(-2, 2), ylim=(-2, 2))
	a0 = ax.plot([], [])
	anim = animation.FuncAnimation(fig, analogPlot.update, fargs=a0, interval=1)
	plt.show()