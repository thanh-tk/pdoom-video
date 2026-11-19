# Contact sheets from a stills folder: <venv python> sheet.py <folder>  (24 frames per sheet, labelled from index.tsv)
import sys
from PIL import Image, ImageDraw
d = sys.argv[1]; rows = [l.split('\t') for l in open(f'{d}/index.tsv').read().splitlines()]
cols, tw, th = 4, 480, 270
for part in range(0, len(rows), 24):
    chunk = rows[part:part + 24]
    sheet = Image.new('RGB', (cols * tw, ((len(chunk) + cols - 1) // cols) * (th + 22)), 'white')
    dr = ImageDraw.Draw(sheet)
    for k, (f, eid, label, t) in enumerate(chunk):
        im = Image.open(f'{d}/{f}').convert('RGB').resize((tw, th))
        x, y = (k % cols) * tw, (k // cols) * (th + 22)
        sheet.paste(im, (x, y)); dr.text((x + 4, y + th + 4), f'{eid} {label} t={t}', fill='black')
    sheet.save(f'{d}/sheet_{part // 24}.png')
print('ok')
