# Contact sheet of skill shots as a full-size JPG (4 x 2 frames, each cropped to 1600 x 800), the evidence kept in docs/ for an
# animation review (docs/SKILL_ANIMATION_STANDARD.md §2.4). Reads the frames scripts/animation/shots.ts wrote. Needs Python 3 + Pillow.
#   python -I scripts/animation/reviewSheet.py <shots dir> <docs out dir> <skillId> [<skillId> ...]
import glob, os, sys
from PIL import Image

src, out, ids = sys.argv[1], sys.argv[2], sys.argv[3:]
os.makedirs(out, exist_ok=True)
W, H, G = 1600, 800, 13
for i in ids:
    fr = sorted(glob.glob(os.path.join(src, '%s_0*.png' % i)))
    sheet = Image.new('RGB', (4 * W + 3 * G, 2 * H + G), (255, 255, 255))
    for k, f in enumerate(fr[:8]):
        sheet.paste(Image.open(f).convert('RGB').crop((0, 50, 1600, 850)), ((k % 4) * (W + G), (k // 4) * (H + G)))
    o = os.path.join(out, '%s_sheet.jpg' % i)
    sheet.save(o, 'JPEG', quality=80, optimize=True)
    print(o, len(fr), 'frames', os.path.getsize(o) // 1024, 'KB')
