"""Finds a focal point for every photo and rebuilds uncropped thumbnails.
Score = local detail (gradients) + colour richness + faces, with a small bias away from bare sky.
Output: js/focus-data.js  -> MD.focal = { "<path under assets/img|thumb>": [fx, fy, w, h] }  (fx, fy are 0-1)"""
import glob, os, json, numpy as np, cv2
from PIL import Image
ROOT = os.path.join(os.path.dirname(__file__), '..')
out = {}
# Hand-set focal points where the automatic guess missed the subject (checked by eye on every photo). (x, y) as fractions of the picture.
OVERRIDE = {
 'fieldwork/winery-3': (.50, .46), 'fieldwork/daruma-3': (.42, .44), 'fieldwork/imori-2': (.50, .38), 'fieldwork/imori-3': (.50, .46),
 'fieldwork/kayak-2': (.58, .62), 'fieldwork/kayak-4': (.46, .42), 'fieldwork/picnic-1': (.55, .30), 'fieldwork/picnic-2': (.50, .55),
 'fieldwork/picnic-3': (.50, .52), 'fieldwork/picnic-4': (.50, .42), 'fieldwork/sup-2': (.46, .52), 'fieldwork/sup-3': (.62, .52),
 'mist': (.50, .46), 'fieldwork/ebike-1': (.46, .62), 'fieldwork/ebike-3': (.62, .74), 'fieldwork/culture-3': (.50, .52),
 'fieldwork/winery-2': (.50, .62), 'fieldwork/zip-4': (.50, .62), 'fieldwork/zip-1': (.50, .66), 'valley-wide': (.42, .68),
}
face = None
try:
    face = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml'))
    if face.empty(): face = None
except Exception: face = None

def focal(path):
    im = cv2.imread(path); h, w = im.shape[:2]
    s = 160 / max(w, h); sm = cv2.resize(im, (max(8, int(w * s)), max(8, int(h * s))), interpolation=cv2.INTER_AREA)
    g = cv2.cvtColor(sm, cv2.COLOR_BGR2GRAY).astype(np.float32)
    gx = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3); gy = cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
    grad = cv2.GaussianBlur(np.hypot(gx, gy), (0, 0), 3)
    hsv = cv2.cvtColor(sm, cv2.COLOR_BGR2HSV).astype(np.float32)
    sat = cv2.GaussianBlur(hsv[..., 1] / 255, (0, 0), 3)
    lum = cv2.GaussianBlur(g / 255, (0, 0), 3)
    # sky / fog / blank wall: bright + low detail + low saturation
    blank = ((lum > .62) & (sat < .22)).astype(np.float32) * (1 - np.clip(grad / (grad.max() + 1e-6) * 3, 0, 1))
    e = grad / (grad.max() + 1e-6) + .6 * sat - .8 * blank
    hh, ww = e.shape
    yy, xx = np.mgrid[0:hh, 0:ww]
    e = e + .25 * np.exp(-(((xx - ww / 2) / (ww * .55)) ** 2 + ((yy - hh * .55) / (hh * .55)) ** 2))   # gentle pull to the middle, slightly low
    e = np.clip(e, 0, None) ** 2
    if face is not None:
        for (x, y, fw, fh) in face.detectMultiScale(cv2.cvtColor(sm, cv2.COLOR_BGR2GRAY), 1.15, 4, minSize=(max(10, ww // 14),) * 2):
            e[max(0, y - fh // 3):y + fh, x:x + fw] += e.max() * 1.6
    tot = e.sum() + 1e-6
    cx = (e * xx).sum() / tot / ww; cy = (e * yy).sum() / tot / hh
    # blend with the single strongest region so two far-apart subjects do not average to empty space between them
    pk = cv2.GaussianBlur(e, (0, 0), 6); py, px = np.unravel_index(pk.argmax(), pk.shape)
    fx = .5 * cx + .5 * (px + .5) / ww; fy = .5 * cy + .5 * (py + .5) / hh
    return round(float(fx), 3), round(float(fy), 3), w, h

def thumb(src, dst, long=480):
    im = Image.open(src).convert('RGB'); w, h = im.size; k = long / max(w, h)
    if k < 1: im = im.resize((round(w * k), round(h * k)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True); im.save(dst, quality=70, optimize=True, progressive=True)

for f in sorted(glob.glob(ROOT + '/assets/img/*.jpg') + glob.glob(ROOT + '/assets/img/fieldwork/*.jpg')):
    rel = os.path.relpath(f, ROOT + '/assets/img')[:-4]
    fx, fy, w, h = focal(f)
    if rel in OVERRIDE: fx, fy = OVERRIDE[rel]
    out[rel] = [fx, fy, w, h]
    thumb(f, ROOT + '/assets/thumb/' + rel + '.jpg')
    print(rel, fx, fy, w, h)
open(ROOT + '/js/focus-data.js', 'w').write('window.MD=window.MD||{};MD.focal=' + json.dumps(out, separators=(',', ':')) + ';\n')
