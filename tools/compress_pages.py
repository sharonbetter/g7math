#!/usr/bin/env python3
"""Convert rendered book page PNGs to web-sized JPEGs."""
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "book", "pages")
DST = os.path.join(ROOT, "data", "book", "pages_jpg")
WIDTH = int(sys.argv[1]) if len(sys.argv) > 1 else 1200
QUALITY = int(sys.argv[2]) if len(sys.argv) > 2 else 62

os.makedirs(DST, exist_ok=True)
names = sorted(n for n in os.listdir(SRC) if n.endswith(".png"))
for i, name in enumerate(names, 1):
    out = os.path.join(DST, name.replace(".png", ".jpg"))
    if os.path.exists(out):
        continue
    with Image.open(os.path.join(SRC, name)) as im:
        im = im.convert("RGB")
        w, h = im.size
        if w > WIDTH:
            im = im.resize((WIDTH, int(h * WIDTH / w)), Image.LANCZOS)
        im.save(out, "JPEG", quality=QUALITY, optimize=True)
    if i % 25 == 0:
        print(f"{i}/{len(names)}", flush=True)
total = sum(os.path.getsize(os.path.join(DST, f)) for f in os.listdir(DST))
print(f"DONE {len(os.listdir(DST))} pages, {total/1024/1024:.1f} MB")
