"""Inspect the actual diorama heightfield and locate a safe Kurohime foothill circuit."""
from pathlib import Path
import json, math
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
L = json.loads((ROOT/'assets/diorama/data/layout.json').read_text())
a = np.array(Image.open(ROOT/'assets/diorama/data/relief-height-lo.png')).astype(float)
h = (a[:,:,0]*256+a[:,:,1])/10-50
H,W = h.shape
SN,SE = L['spanMetres']['northSouth'], L['spanMetres']['eastWest']
def height(x,z):
    r = np.clip((SN/2-x)/SN*H-.5,0,H-1.001)
    c = np.clip((z+SE/2)/SE*W-.5,0,W-1.001)
    i,j = int(r),int(c); fr,fc = r-i,c-j
    return (h[i,j]*(1-fc)+h[i,j+1]*fc)*(1-fr)+(h[i+1,j]*(1-fc)+h[i+1,j+1]*fc)*fr
def segdist(x,z,a,b):
    dx,dz=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz or 1)))
    return math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)
def metrics(x,z):
    slope=math.hypot(height(x+120,z)-height(x-120,z),height(x,z+120)-height(x,z-120))/240
    rivers=min(segdist(x,z,a,b)-(r.get('width',120)/2+280) for r in L['rivers'] for a,b in zip(r['points'],r['points'][1:]))
    models=min(math.hypot(x-a['x'],z-a['z'])-(a['size']*.62+500) for a in L['attractions'])
    return height(x,z),slope,rivers,models
if __name__=='__main__':
    for x in range(-12200,-9999,400):
        for z in range(-2700,-1099,400):
            ht,s,r,m=metrics(x,z)
            if s<.38 and r>180 and m>180 and ht<1350:
                print(x,z,'height',round(ht),'slope',round(s,2),'river clearance',round(r),'model clearance',round(m))
