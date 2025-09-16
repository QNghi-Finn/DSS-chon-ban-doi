import math
def haversine_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2): return None
    R=6371.0
    dLat=math.radians(lat2-lat1); dLon=math.radians(lon2-lon1)
    a=math.sin(dLat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dLon/2)**2
    return 2*R*math.asin(math.sqrt(a))
