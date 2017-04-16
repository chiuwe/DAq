import sys

upper = 'ABCDEFGHIJKLMNOPQRSTUVWX'
lower = 'abcdefghijklmnopqrstuvwx'

def toGrid(decLat, decLon):
    if not (-180<=decLon<180):
        sys.stderr.write('longitude must be -180<=lon<180, given %f\n'%decLon)
        sys.exit(32)
    if not (-90<=decLat<90):
        sys.stderr.write('latitude must be -90<=lat<90, given %f\n'%decLat)
        sys.exit(33) # can't handle north pole, sorry, [A-R]

    adjLat = decLat + 90.0
    adjLon = decLon + 180.0

    gridLatSq = upper[int(adjLat/10)];
    gridLonSq = upper[int(adjLon/20)];

    gridLatField = str(int(adjLat%10))
    gridLonField = str(int((adjLon/2)%10))

    adjLatRemainder = (adjLat - int(adjLat)) * 60
    adjLonRemainder = ((adjLon) - int(adjLon/2)*2) * 60

    gridLatSubsq = lower[int(adjLatRemainder/2.5)]
    gridLonSubsq = lower[int(adjLonRemainder/5)]

    return gridLonSq + gridLatSq + gridLonField + gridLatField + gridLonSubsq + gridLatSubsq
