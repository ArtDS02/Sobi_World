# Review grid of skill shots: one row per skill, chosen frames side by side at 800 px wide (default frames 2..5 = -100, 0, +150,
# +400 ms round the impact), for a close look before a verdict (docs/SKILL_ANIMATION_STANDARD.md §2.4). Needs Python 3 + Pillow.
#   python -I scripts/animation/reviewGrid.py <shots dir> <out.png> <skillId> [<skillId> ...] [--idx 2,3,4,5] [--crop x,y,w,h]
import glob, os, sys
from PIL import Image

args = sys.argv[1:]
idx = [2, 3, 4, 5]
crop = (0, 0, 1600, 900)
if '--idx' in args:
    i = args.index('--idx'); idx = [int(v) for v in args[i + 1].split(',')]; del args[i:i + 2]
if '--crop' in args:
    i = args.index('--crop'); crop = tuple(int(v) for v in args[i + 1].split(',')); del args[i:i + 2]
src, out, ids = args[0], args[1], args[2:]
cw = 800
ch = round(cw * crop[3] / crop[2])
G = 8
img = Image.new('RGB', (len(idx) * cw + (len(idx) - 1) * G, len(ids) * ch + (len(ids) - 1) * G), (255, 255, 255))
for r, sid in enumerate(ids):
    fr = sorted(glob.glob(os.path.join(src, '%s_0*.png' % sid)))
    for c, k in enumerate(idx):
        if k < len(fr):
            im = Image.open(fr[k]).convert('RGB').crop((crop[0], crop[1], crop[0] + crop[2], crop[1] + crop[3])).resize((cw, ch))
            img.paste(im, (c * (cw + G), r * (ch + G)))
img.save(out)
print(out, img.size)
