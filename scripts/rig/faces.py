"""Faces drawn from a creature's own picture (decision 050): for skinned rigs that have no Gemini face sheet.

Half-closed and angry eyes are the picture's own eyes under a lid (the skin under them is the inpainted one); closed, happy, hurt
and dizzy eyes are strokes in the eye's own ink; mouths are drawn where the resting mouth is, in the creature's ink, with a dark
inside, a tongue and teeth. Everything is drawn ×4 and scaled down, so the strokes are as soft as the paint around them.
Used by skin.py; coordinates are px of the 1024 rig canvas.
"""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SS = 4
INSIDE = (112, 42, 48, 255)
TONGUE = (236, 128, 138, 255)
TEETH = (252, 249, 242, 255)
TEAR = (178, 220, 248, 235)


class Patch:
    """A ×4 drawing surface over a box of the canvas."""

    def __init__(self, box: tuple[float, float, float, float]):
        self.x0, self.y0 = int(box[0]) - 4, int(box[1]) - 4
        self.w, self.h = int(box[2] - box[0]) + 8, int(box[3] - box[1]) + 8
        self.img = Image.new("RGBA", (self.w * SS, self.h * SS), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)

    def p(self, x: float, y: float) -> tuple[float, float]:
        return ((x - self.x0) * SS, (y - self.y0) * SS)

    def line(self, pts, width: float, color) -> None:
        q = [self.p(*pt) for pt in pts]
        w = max(1, round(width * SS))
        self.d.line(q, fill=color, width=w, joint="curve")
        for x, y in (q[0], q[-1]):  # round caps
            self.d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=color)

    def poly(self, pts, fill, outline=None, width: float = 0) -> None:
        self.d.polygon([self.p(*pt) for pt in pts], fill=fill)
        if outline is not None:
            self.line(list(pts) + [pts[0]], width, outline)

    def onto(self, can: Image.Image) -> None:
        small = self.img.resize((self.w, self.h), Image.LANCZOS)
        can.alpha_composite(small, (max(0, self.x0), max(0, self.y0))) if self.x0 >= 0 and self.y0 >= 0 else can.paste(small, (self.x0, self.y0), small)


def ink_of(can: Image.Image, cx: float, cy: float, rx: float, ry: float) -> tuple[int, int, int, int]:
    """The darkest paint inside an eye: its outline and pupil ink."""
    a = np.array(can.crop((int(cx - rx), int(cy - ry), int(cx + rx), int(cy + ry)))).astype(int)
    m = (a[..., 3] > 200)
    lum = a[..., :3].mean(axis=2)
    pick = a[m & (lum < np.percentile(lum[m], 12))][:, :3] if m.any() else np.array([[60, 35, 30]])
    r, g, b = np.median(pick, axis=0)
    return (int(r), int(g), int(b), 255)


def arc(cx, cy, rx, ry, bulge: float, n: int = 16):
    """A curve across an eye: `bulge` > 0 sags down (closed lids), < 0 arches up (happy)."""
    return [(cx + rx * u, cy + bulge * ry * (1 - u * u)) for u in np.linspace(-1, 1, n)]


def eyes(can_size, sides, open_layer: Image.Image, ink) -> dict[str, Image.Image]:
    """sides: [(cx, cy, rx, ry, inner)] on the 1024 canvas, near eye first; inner = +1 if the nose is to its right."""
    out = {}
    for name in ("half", "closed", "angry", "hurt", "dizzy", "happy"):
        can = Image.new("RGBA", can_size, (0, 0, 0, 0))
        for k, (cx, cy, rx, ry, inner) in enumerate(sides):
            w = max(2.0, 0.2 * ry)
            box = (cx - 1.6 * rx, cy - 1.8 * ry, cx + 1.6 * rx, cy + 1.6 * ry)
            if name in ("half", "angry"):
                eye = open_layer.crop(tuple(int(v) for v in box))
                mask = Image.new("L", eye.size, 255)
                md = ImageDraw.Draw(mask)
                ox, oy = int(box[0]), int(box[1])
                if name == "half":
                    cut = cy - 0.05 * ry
                    md.rectangle([0, 0, eye.width, cut - oy], fill=0)
                else:
                    # The lid slants down towards the nose; the picture's own brow goes, a fierce one is drawn.
                    a = (cx - inner * 1.3 * rx - ox, cy - 0.62 * ry - oy)
                    b = (cx + inner * 1.3 * rx - ox, cy - 0.02 * ry - oy)
                    md.polygon([(a[0], -10), (b[0], -10), b, a], fill=0)
                mask = mask.filter(ImageFilter.GaussianBlur(0.8))
                eye.putalpha(Image.fromarray(np.minimum(np.array(eye.getchannel("A")), np.array(mask))))
                can.alpha_composite(eye, (ox, oy))
                pt = Patch(box)
                if name == "half":
                    pt.line(arc(cx, cy - 0.05 * ry, rx * 0.98, ry, 0.12), w * 1.1, ink)
                else:
                    pt.line([(cx - inner * 1.15 * rx, cy - 0.62 * ry), (cx + inner * 1.15 * rx, cy - 0.02 * ry)], w, ink)
                    # A tapered brow: thick towards the nose, thin outside, slightly arched.
                    bx = [cx - inner * (1.0 - 1.85 * t) * rx for t in np.linspace(0, 1, 9)]
                    by = [cy - (1.3 - 0.5 * t) * ry - 0.12 * ry * np.sin(np.pi * t) for t in np.linspace(0, 1, 9)]
                    for i in range(8):
                        pt.line([(bx[i], by[i]), (bx[i + 1], by[i + 1])], w * (0.5 + 0.9 * i / 7), ink)
                pt.onto(can)
                continue
            pt = Patch(box)
            if name == "closed":
                pt.line(arc(cx, cy + 0.05 * ry, rx * 0.85, ry, 0.3), w, ink)
            elif name == "happy":
                pt.line(arc(cx, cy + 0.25 * ry, rx * 0.8, ry, -0.55), w, ink)
            elif name == "hurt":
                s = inner  # the point of the > < looks at the nose
                pt.line([(cx - s * 0.6 * rx, cy - 0.5 * ry), (cx + s * 0.6 * rx, cy), (cx - s * 0.6 * rx, cy + 0.5 * ry)], w, ink)
                if k == len(sides) - 1:
                    tx, ty, tr = cx + 0.3 * rx, cy + 0.85 * ry, 0.22 * ry
                    pt.poly([(tx, ty - 1.8 * tr), (tx + tr, ty), (tx, ty + tr), (tx - tr, ty)], TEAR, ink, 0.35 * w)
            elif name == "dizzy":
                ts = np.linspace(0, 2.3 * 2 * np.pi, 60)
                rr = 0.12 + 0.75 * ts / ts[-1]
                pt.line([(cx + rx * r * np.cos(t), cy + ry * 0.85 * r * np.sin(t)) for t, r in zip(ts, rr)], w * 0.85, ink)
            pt.onto(can)
        out[f"eyes_{name}"] = can
    return out


def mouths(can_size, box, room: tuple[float, float], ink) -> dict[str, Image.Image]:
    """box: the resting mouth on the 1024 canvas; room: how big a shout may get (w, h)."""
    x0, y0, x1, y1 = box
    mx = (x0 + x1) / 2
    ly = y0 + 0.45 * (y1 - y0)
    W = min(room[0], 1.1 * (x1 - x0))
    Hm = room[1]
    w = max(2.0, 0.07 * W)
    out = {}
    area = (mx - W, ly - 0.4 * Hm, mx + W, ly + 1.3 * Hm)
    # open: a round shout, tongue at the bottom
    pt = Patch(area)
    ow, oh = 0.42 * W, min(Hm, 0.62 * W)
    o = [(mx + ow * np.cos(t), ly + oh / 2 + oh / 2 * np.sin(t)) for t in np.linspace(0, 2 * np.pi, 28, endpoint=False)]
    pt.poly(o, INSIDE)
    pt.poly([(mx + 0.62 * ow * np.cos(t), ly + 0.78 * oh + 0.2 * oh * np.sin(t)) for t in np.linspace(0, 2 * np.pi, 20, endpoint=False)], TONGUE)
    pt.line(o + [o[0]], w, ink)
    can = Image.new("RGBA", can_size, (0, 0, 0, 0))
    pt.onto(can)
    out["mouth_open"] = can
    # smile: a wide D, flat on top
    pt = Patch(area)
    sw, sh = 0.5 * W, min(Hm * 0.8, 0.5 * W)
    top = [(mx + sw * u, ly + 0.08 * sh * (u * u - 1)) for u in np.linspace(-1, 1, 10)]
    bot = [(mx + sw * u, ly + sh * (1 - u * u) ** 0.8) for u in np.linspace(1, -1, 18)]
    pt.poly(top + bot, INSIDE)
    pt.poly([(mx + 0.55 * sw * u, ly + sh * (0.62 + 0.38 * (1 - u * u) ** 0.8)) for u in np.linspace(-1, 1, 14)] +
            [(mx + 0.55 * sw * u, ly + 0.62 * sh) for u in np.linspace(1, -1, 6)], TONGUE)
    pt.line(top + bot + [top[0]], w, ink)
    can = Image.new("RGBA", can_size, (0, 0, 0, 0))
    pt.onto(can)
    out["mouth_smile"] = can
    # grit: clenched teeth
    pt = Patch(area)
    gw, gh = 0.48 * W, min(Hm * 0.55, 0.36 * W)
    r = [(mx - gw, ly - 0.1 * gh), (mx + gw, ly - 0.1 * gh), (mx + gw * 0.92, ly + gh), (mx - gw * 0.92, ly + gh)]
    pt.poly(r, TEETH)
    pt.line([(mx - gw * 0.96, ly + 0.45 * gh), (mx + gw * 0.96, ly + 0.45 * gh)], w * 0.6, ink)
    for u in (-0.5, 0, 0.5):
        pt.line([(mx + u * gw, ly - 0.05 * gh), (mx + u * gw * 0.95, ly + 0.95 * gh)], w * 0.55, ink)
    pt.line(r + [r[0]], w, ink)
    can = Image.new("RGBA", can_size, (0, 0, 0, 0))
    pt.onto(can)
    out["mouth_grit"] = can
    # cry: a wobbly line, corners down
    pt = Patch(area)
    cw = 0.42 * W
    pt.line([(mx + cw * u, ly + 0.12 * W * (u * u) - 0.04 * W * np.sin(u * 3 * np.pi)) for u in np.linspace(-1, 1, 24)], w, ink)
    can = Image.new("RGBA", can_size, (0, 0, 0, 0))
    pt.onto(can)
    out["mouth_cry"] = can
    return out
