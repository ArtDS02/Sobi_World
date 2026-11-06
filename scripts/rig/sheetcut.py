"""Clean-up pass after `art.py cut rig-01-layers` (decision 050).

Gemini does not always keep the requested grid: some face sheets came back with frame
lines, a different cell count or a second variant row. For those sheets the cells are
listed here by hand (fractions of the sheet), everything else keeps the art.py cut.
Every candidate then gets the same clean-up:
  - grey sheet background trapped inside a shape (a spiral, a framed cell) is removed;
  - stray neutral blobs (the generator's sparkle mark, crumbs) are dropped;
  - the cut edge is feathered by one pixel so no grey fringe stays on the outline.

Usage: python scripts/rig/sheetcut.py   (re-runs art.py cut first, then cleans every candidate)
"""
from __future__ import annotations

import subprocess
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SHEETS = ROOT / "art_inbox/.batch/rig-01-layers"
CAND = ROOT / "art_inbox/.candidates"
BG = np.array((200, 200, 200), dtype=np.int16)

# sheet -> {part: (x0, y0, x1, y1) as fractions of the sheet, optional erase boxes in the same frame}
MANUAL: dict[str, dict[str, tuple]] = {
    # 4 + 2 + 2 + 2 cells with frame lines; the fish shows ONE eye, so pairs keep the right eye.
    "F2": {
        "fish_betta_eyes_open": (0.01, 0.01, 0.24, 0.25),
        "fish_betta_eyes_half": (0.26, 0.01, 0.49, 0.25),
        "fish_betta_eyes_closed": (0.01, 0.28, 0.49, 0.49),  # lid fully down: continues the blink from `half`
        "fish_betta_eyes_angry": (0.76, 0.01, 0.99, 0.25),
        "fish_betta_eyes_hurt": (0.27, 0.52, 0.49, 0.74),
        "fish_betta_eyes_dizzy": (0.77, 0.52, 0.99, 0.74),
        "fish_betta_eyes_happy": (0.27, 0.77, 0.49, 0.99),
        "fish_betta_mouth_neutral": (0.52, 0.77, 0.84, 0.99),
    },
    # Two variant rows inside frames: row 1 = variant a, row 2 = variant b.
    "F3": {
        "fish_betta_mouth_open": (0.01, 0.01, 0.245, 0.49),
        "fish_betta_mouth_grit": (0.26, 0.01, 0.495, 0.49),
        "fish_betta_mouth_smile": (0.51, 0.01, 0.745, 0.49),
        "fish_betta_mouth_cry": (0.755, 0.01, 0.99, 0.49),
    },
    "F3b": {
        "fish_betta_mouth_open": (0.01, 0.51, 0.245, 0.99),
        "fish_betta_mouth_grit": (0.26, 0.51, 0.495, 0.99),
        "fish_betta_mouth_smile": (0.51, 0.51, 0.745, 0.99),
        "fish_betta_mouth_cry": (0.755, 0.51, 0.88, 0.99),
    },
    "O3": {
        "octopus_mouth_open": (0.01, 0.28, 0.245, 0.72),
        "octopus_mouth_grit": (0.255, 0.28, 0.495, 0.72),
        "octopus_mouth_smile": (0.505, 0.28, 0.745, 0.72),
        "octopus_mouth_cry": (0.755, 0.28, 0.99, 0.72),
    },
}
# Extra marks the generator added inside a cell: (sheet, part) -> erase boxes (sheet fractions).
ERASE = {
    ("O2", "octopus_eyes_angry"): [(0.858, 0.272, 0.912, 0.335)],  # a frown mouth drawn under the angry eyes
}
ERASE_SRC = {"O2": ("octopus_eyes_angry", (0.76, 0.08, 0.99, 0.40))}


def label(mask: np.ndarray) -> tuple[np.ndarray, int]:
    """4-connected component labels (no scipy in the toolchain)."""
    h, w = mask.shape
    lab = np.zeros((h, w), dtype=np.int32)
    flat, lf = mask.ravel(), lab.ravel()
    n = 0
    for start in np.flatnonzero(flat):
        if lf[start]:
            continue
        n += 1
        lf[start] = n
        q = deque([start])
        while q:
            i = q.popleft()
            y, x = divmod(i, w)
            for j, ok in ((i - w, y > 0), (i + w, y < h - 1), (i - 1, x > 0), (i + 1, x < w - 1)):
                if ok and flat[j] and not lf[j]:
                    lf[j] = n
                    q.append(j)
    return lab, n


def keyed(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Keep-mask: grey sheet background removed wherever it is, not just from the border."""
    diff = np.abs(rgb.astype(np.int16) - BG).max(axis=2)
    chroma = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2)
    # Pale neutral (frame lines, the generator's sparkle mark) goes only where it touches the outside,
    # so enclosed white (teeth, eye shine) stays.
    pale = (rgb.min(axis=2) > 205) & (chroma < 14)
    bg = ((diff <= 22) & (chroma <= 12)) | pale | (alpha == 0)
    border = np.zeros_like(bg)
    border[0, :] = border[-1, :] = True
    border[:, 0] = border[:, -1] = True
    lab, _ = label(bg)
    outside = np.isin(lab, np.unique(lab[border & bg])) & bg
    trapped = (diff <= 16) & (chroma <= 12)  # sheet grey inside a spiral or ring
    return ~(outside | trapped)


def tidy(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    keep = keyed(arr[..., :3], arr[..., 3])
    lab, n = label(keep)
    if n:
        sizes = np.bincount(lab.ravel(), minlength=n + 1)[1:]
        biggest = sizes.max()
        lum = arr[..., :3].astype(np.int16).mean(axis=2)
        chroma = arr[..., :3].max(axis=2).astype(np.int16) - arr[..., :3].min(axis=2)
        for i, size in enumerate(sizes, start=1):
            m = lab == i
            neutral = np.percentile(chroma[m], 90) < 22 and lum[m].min() > 150
            if size < max(40, biggest * 0.002) or neutral:  # crumbs, sparkle mark
                keep[m] = False
    alpha = Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.8))
    arr[..., 3] = np.minimum(arr[..., 3], np.array(alpha))
    out = Image.fromarray(arr)
    box = out.getbbox()
    return out.crop(box) if box else out


def frac(sheet: Image.Image, box: tuple) -> tuple[int, int, int, int]:
    w, h = sheet.size
    return (round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h))


MARK = 48  # the generator's sparkle sits in a fixed 48 px square, 96 px from the bottom-right corner
MARK_FREE = ("B2", "B3", "O2", "O3", "T2", "O1")  # sheets where the mark lies on bare grey


def mark_box(w: int, h: int) -> tuple[slice, slice]:
    return slice(h - 96 - MARK, h - 96), slice(w - 96 - MARK, w - 96)


def mark_alpha(raw: Path) -> np.ndarray:
    """White-overlay opacity of the mark, measured where it covers plain sheet grey."""
    alphas = []
    for sid in MARK_FREE:
        im = np.array(Image.open(raw / f"{sid}.png").convert("RGB")).astype(float)
        ys, xs = mark_box(im.shape[1], im.shape[0])
        p = im[ys, xs].mean(axis=2)
        bg = np.median(np.concatenate([p[0], p[-1], p[:, 0], p[:, -1]]))
        alphas.append(np.clip((p - bg) / (255 - bg), 0, 0.95))
    a = np.median(alphas, axis=0)
    return np.where(a > 0.02, a, 0)


def despark(raw: Path) -> None:
    """Un-blends the mark from every sheet (art = (seen - 255a) / (1 - a)); the owner's renders stay in raw/."""
    a = mark_alpha(raw)[..., None]
    for f in sorted(raw.glob("[A-Z][0-9].png")):
        im = Image.open(f).convert("RGBA")
        arr = np.array(im).astype(float)
        ys, xs = mark_box(im.width, im.height)
        rgb = arr[ys, xs, :3]
        arr[ys, xs, :3] = np.clip((rgb - 255 * a) / (1 - a), 0, 255)
        Image.fromarray(arr.round().astype(np.uint8)).save(SHEETS / f.name)


def main() -> None:
    raw = SHEETS / "raw"
    if not raw.exists():  # first run: keep the renders untouched
        raw.mkdir()
        for f in SHEETS.glob("[A-Z][0-9].png"):
            (raw / f.name).write_bytes(f.read_bytes())
    despark(raw)
    # Start from a fresh art.py cut every time, so the clean-up never runs twice on one file.
    subprocess.run([sys.executable, str(ROOT / ".claude/skills/image-to-prompt/scripts/art.py"), "cut", "rig-01-layers", "--force"],
                   cwd=ROOT, stdout=subprocess.DEVNULL)  # exits 1 on grid warnings; MANUAL covers those sheets
    manual: dict[str, Image.Image] = {}
    for key, cells in MANUAL.items():
        sheet = Image.open(SHEETS / f"{key[:2]}.png").convert("RGBA")
        variant = "b" if key.endswith("b") else "a"
        for part, box in cells.items():
            manual[f"rigsrc_{part}_{variant}"] = sheet.crop(frac(sheet, box))
    for sid, (part, src) in ERASE_SRC.items():
        sheet = Image.open(SHEETS / f"{sid}.png").convert("RGBA")
        for e in ERASE[(sid, part)]:
            sheet.paste((200, 200, 200, 255), frac(sheet, e))
        manual[f"rigsrc_{part}_a"] = sheet.crop(frac(sheet, src))
    files = sorted(CAND.glob("rigsrc_*.png"))
    names = {f.stem for f in files} | set(manual)
    for name in sorted(names):
        src = manual.get(name) or Image.open(CAND / f"{name}.png")
        tidy(src).save(CAND / f"{name}.png")
    print(f"sheetcut: {len(names)} candidates cleaned ({len(manual)} re-cut by hand)")


if __name__ == "__main__":
    main()
