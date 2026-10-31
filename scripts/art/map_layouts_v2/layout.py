# Map layout v2 (decision 045): a tiny drawing kit for designing exploration areas as tile grids, plus a reachability check.
# Layouts are design sources for art and for the later maps.json import; the game does not read these files.
#
# Tiles:  .  ground   ,  path   ~  water   =  bridge (path over water)   #  dense mass (forest / rock), blocks
#         ^  raised ground (walkable)   F  cliff face / rim, blocks   s  steps up a cliff   c  corrupted ground (walkable)
#         w  waterfall, blocks
# Objects (kind, x, y, attrs): see KINDS.
from __future__ import annotations

import math
from collections import deque
from dataclasses import dataclass, field

WALK = set(".,=^sc")
KINDS = {
    "spawn": "where the party arrives", "portal": "zone portal (teleport stone)", "exit": "way to another area",
    "group": "monster group", "chest": "treasure chest", "gate": "element barrier (fake wall)", "spring": "healing spring",
    "lore": "lore stone", "npc": "NPC / event spot", "herb": "herb patch", "landmark": "big landmark", "puzzle": "element puzzle object",
    "crystal": "corruption crystals", "ore": "ore node",
}


def _noise(x: float, y: float, seed: int) -> float:
    """Smooth value noise in [-1, 1]; deterministic, no rng."""
    def h(ix: int, iy: int) -> float:
        n = (ix * 374761393 + iy * 668265263 + seed * 2147483647) & 0xFFFFFFFF
        n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
        return ((n ^ (n >> 16)) & 0xFFFF) / 32767.5 - 1
    x0, y0 = math.floor(x), math.floor(y)
    fx, fy = x - x0, y - y0
    sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a = h(x0, y0) + (h(x0 + 1, y0) - h(x0, y0)) * sx
    b = h(x0, y0 + 1) + (h(x0 + 1, y0 + 1) - h(x0, y0 + 1)) * sx
    return a + (b - a) * sy


@dataclass
class Layout:
    key: str
    code: str
    name: str
    zone: str
    w: int
    h: int
    theme: str
    corruption: int
    seed: int = 1
    min_walk: float = 0.4
    covers: list = field(default_factory=list)
    objects: list = field(default_factory=list)

    def __post_init__(self):
        self.g = [["." for _ in range(self.w)] for _ in range(self.h)]

    # --- drawing -------------------------------------------------------------------------------------------------------------
    def get(self, x, y):
        return self.g[y][x] if 0 <= x < self.w and 0 <= y < self.h else "#"

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.g[y][x] = c

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.set(x, y, c)

    def blob(self, cx, cy, rx, ry, c, rough=0.3):
        for y in range(int(cy - ry - 2), int(cy + ry + 3)):
            for x in range(int(cx - rx - 2), int(cx + rx + 3)):
                d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                if d <= 1 + rough * _noise(x / 3, y / 3, self.seed + ord(c)):
                    self.set(x, y, c)

    def border(self, lo=2, hi=4):
        """An irregular band of dense mass around the map."""
        span = hi - lo
        for x in range(self.w):
            t = lo + round((_noise(x / 5, 0, self.seed) + 1) / 2 * span)
            b = lo + round((_noise(x / 5, 9, self.seed) + 1) / 2 * span)
            self.rect(x, 0, x, t - 1, "#")
            self.rect(x, self.h - b, x, self.h - 1, "#")
        for y in range(self.h):
            l = lo + round((_noise(0, y / 5, self.seed + 3) + 1) / 2 * span)
            r = lo + round((_noise(9, y / 5, self.seed + 3) + 1) / 2 * span)
            self.rect(0, y, l - 1, y, "#")
            self.rect(self.w - r, y, self.w - 1, y, "#")

    def line(self, pts, width=2, c=","):
        """A thick polyline. A path over water becomes a bridge; anything else is overwritten (paths carve through masses)."""
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = max(1, int(max(abs(x1 - x0), abs(y1 - y0)) * 3))
            prev = None
            for i in range(n + 1):
                px, py = x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n
                cell = (round(px), round(py))
                # A diagonal step also takes the corner cell, so a one-tile trail stays walkable (4-neighbour).
                steps = [(cell[0], prev[1]), cell] if prev and cell[0] != prev[0] and cell[1] != prev[1] else [cell]
                prev = cell
                for (cx, cy) in steps:
                    self._stamp(cx, cy, width, c)

    def _stamp(self, cx, cy, width, c):
        lo = -((width - 1) // 2)
        for dy in range(lo, lo + width):
            for dx in range(lo, lo + width):
                x, y = cx + dx, cy + dy
                cur = self.get(x, y)
                if c == "," and cur in "~=":
                    self.set(x, y, "=")
                elif c == "," and cur in "s^":
                    continue
                else:
                    self.set(x, y, c)

    def plateau(self, x0, y0, x1, y1, face=2):
        """Raised ground: walkable top, a cliff face along the bottom (3/4 view) and a cliff rim on the other three sides."""
        self.rect(x0, y0, x1, y1, "F")
        self.rect(x0 + 1, y0 + 1, x1 - 1, y1 - face, "^")

    def steps(self, x0, x1, y0, y1):
        self.rect(x0, y0, x1, y1, "s")

    # --- objects -------------------------------------------------------------------------------------------------------------
    def add(self, kind, x, y, **a):
        assert kind in KINDS, kind
        self.objects.append(dict(kind=kind, x=x, y=y, **a))

    def foes(self, prefix, rows):
        """Normal groups g_<prefix>_a, _b ...; a row is (x, y, enemy) or (x, y, enemy, {"sleep": True, "cls": "mutant", ...})."""
        for i, r in enumerate(rows):
            extra = r[3] if len(r) > 3 else {}
            self.add("group", r[0], r[1], id=f"g_{prefix}_{chr(97 + i)}", enemy=r[2], **{"cls": "normal", **extra})

    def shore(self, y0, amp=2.0, c="~"):
        """Sea below a wavy shoreline at about row y0."""
        for x in range(self.w):
            top = round(y0 + amp * _noise(x / 6, 4, self.seed + 5))
            self.rect(x, top, x, self.h - 1, c)

    def cover(self, x0, y0, x1, y1, what):
        self.covers.append(dict(x0=x0, y0=y0, x1=x1, y1=y1, what=what))

    # --- checks --------------------------------------------------------------------------------------------------------------
    def problems(self) -> list[str]:
        out = []
        spawn = next(o for o in self.objects if o["kind"] == "spawn")
        gates = {(o["x"], o["y"]) for o in self.objects if o["kind"] == "gate"}
        seen = {(spawn["x"], spawn["y"])}
        if self.get(spawn["x"], spawn["y"]) not in WALK:
            out.append("spawn is not on walkable ground")
        q = deque(seen)
        while q:
            x, y = q.popleft()
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if (nx, ny) in seen or not (0 <= nx < self.w and 0 <= ny < self.h):
                    continue
                if self.get(nx, ny) in WALK or (nx, ny) in gates:
                    seen.add((nx, ny))
                    q.append((nx, ny))
        for o in self.objects:
            if o["kind"] in ("crystal", "landmark"):
                continue
            x, y = o["x"], o["y"]
            near = [(x, y), (x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
            if not any(p in seen for p in near):
                out.append(f"{o['kind']} {o.get('id', '')} at ({x},{y}) cannot be reached")
            if o["kind"] == "exit":
                if not (x in (0, self.w - 1) or y in (0, self.h - 1) or o.get("inside")):
                    out.append(f"exit {o.get('id')} at ({x},{y}) is not on the map edge")
            elif o["kind"] in ("group", "chest", "spring", "lore", "npc", "herb", "ore", "puzzle", "portal") and self.get(x, y) not in WALK:
                out.append(f"{o['kind']} {o.get('id', '')} at ({x},{y}) stands on '{self.get(x, y)}'")
        walk = sum(1 for row in self.g for c in row if c in WALK)
        if walk / (self.w * self.h) < self.min_walk:
            out.append(f"only {walk * 100 // (self.w * self.h)} % walkable")
        return out

    def text(self) -> str:
        groups = [o for o in self.objects if o["kind"] == "group"]
        lines = [f"# {self.code} {self.key} — {self.name} ({self.w} x {self.h}), zone {self.zone}, corruption {self.corruption} %",
                 f"# {self.theme}", f"# {len(groups)} monster groups", "", "grid:"]
        lines += ["".join(r) for r in self.g]
        lines += ["", "covers (overhead cover over a hidden area):"]
        lines += [f"  ({c['x0']},{c['y0']})-({c['x1']},{c['y1']}) {c['what']}" for c in self.covers]
        lines += ["", "objects (kind x y attrs):"]
        for o in self.objects:
            extra = " ".join(f"{k}={v}" for k, v in o.items() if k not in ("kind", "x", "y"))
            lines.append(f"  {o['kind']:9} {o['x']:3} {o['y']:3}  {extra}")
        return "\n".join(lines) + "\n"
