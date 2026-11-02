# Brings painted v3 areas into the game (decision 046): for each area of a batch it reads the master picture (bg_prepare.py) and the
# layout draft (layout_v3.py), proposes the walk mask from the picture's colours (trail / grass / water / forest; the raised ridge's top,
# cliff and stone stairs; plank bridges near the draft's), puts each exit on the painted trail where it meets its edge (ways out of the
# zone keep their tile and get a trail carved to them), moves every object to the nearest fitting tile from its draft spot, sets each
# element gate on the narrowest neck between the spawn and what it guarded in the draft, moves each cover with its hidden chest,
# works out every arrival both ways and writes it all into content/adventure/maps.json (ids, counts, kinds, behaviour kept), with the
# area's `scene`. A PROPOSAL: the owner approves it on the overlays (overlay.py). Run `npm run content:fmt` and the map tests after.
# Usage: python scripts/art/map_v3/import_v3.py --batch adventure-16-forest-3q M1:bg_adv_v3_forest_edge M3:... [--keep exit_a,exit_b]
import argparse
import json
import math
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from bg_prepare import MAX_CHUNK, PX  # noqa: E402
from layout_v3 import OPEN, WALK, inward, link, live_maps, props_by_id  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
SAMPLES = 8
RAISED = set("^Fsw")
FITS = {}


def shares(master, cols, rows, lava=False):
    im = np.asarray(master.convert("RGB").resize((cols * SAMPLES, rows * SAMPLES), Image.BOX)).astype(float)
    R, G, B = im[..., 0], im[..., 1], im[..., 2]
    lum = 0.3 * R + 0.59 * G + 0.11 * B
    sat = im.max(axis=2) - im.min(axis=2)
    path = (R > 175) & (G > 145) & (B < 150) & (R >= G)
    # The mountain's `~` is lava: bright orange-red, not blue.
    water = ((R > 190) & (R - G > 85) & (B < 90)) if lava else ((B > R + 25) & (B > 130))
    stone = (sat < 32) & (lum > 105) & (lum < 215)

    def per_tile(mask):
        return mask.reshape(rows, SAMPLES, cols, SAMPLES).mean(axis=(1, 3))

    tiles = lum.reshape(rows, SAMPLES, cols, SAMPLES)
    return {
        "path": per_tile(path),
        "water": per_tile(water),
        "stone": per_tile(stone),
        "lum": tiles.mean(axis=(1, 3)),
        "std": tiles.std(axis=(1, 3)),
        "lava": lava,
        # Blue-grey rock (a cave's boulders and ridges) is as bright as its floor; ground is never bluish.
        "blue": per_tile(B > R + 12),
    }


def fit_ground(sh, draft, cols, rows):
    """Open ground against forest by the painting's own light: the brightness that best splits its tiles in two (Otsu; a sick forest is
    greyer, a sunny meadow brighter, so no fixed number fits all). Returns walk[y, x] and (agreement with the draft, threshold)."""
    v = np.sort(sh["lum"].ravel())
    best = (0.0, float(v.mean()))
    for th in np.linspace(v[0], v[-1], 240)[1:-1]:
        a, b = v[v < th], v[v >= th]
        score = len(a) * len(b) * (a.mean() - b.mean()) ** 2
        if score > best[0]:
            best = (score, float(th))
    pred = ((sh["lum"] >= best[1]) & (sh["blue"] < 0.5)) | (sh["path"] >= 0.45)
    want = np.array([[draft[y][x] in WALK for x in range(cols)] for y in range(rows)])
    return pred, (float((pred == want)[1:-1, 1:-1].mean()), best[1])


def near(grid, x, y, chars, r):
    rows, cols = len(grid), len(grid[0])
    return any(0 <= y + dy < rows and 0 <= x + dx < cols and grid[y + dy][x + dx] in chars for dy in range(-r, r + 1) for dx in range(-r, r + 1))


def components(cells):
    cells, out = set(cells), []
    while cells:
        start = cells.pop()
        comp, todo = {start}, [start]
        while todo:
            x, y = todo.pop()
            for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if n in cells:
                    cells.remove(n)
                    comp.add(n)
                    todo.append(n)
        out.append(comp)
    return out


def propose(draft_terrain, sh, cols, rows):
    d = draft_terrain
    g = [["#"] * cols for _ in range(rows)]
    ground, fit = fit_ground(sh, d, cols, rows)
    propose.fit = fit
    for y in range(rows):
        for x in range(cols):
            # Lava cannot be mistaken for sky, so it counts wherever it is painted, also where the draft had none.
            if sh["water"][y, x] >= 0.5 and (sh["lava"] or near(d, x, y, "~w=", 4)):
                g[y][x] = "~"
            elif sh["path"][y, x] >= 0.45:
                g[y][x] = ","
            elif ground[y, x]:
                g[y][x] = "."
    # Raised ground: around each raised part of the draft, the walkable patch that overlaps the draft's top is the top; brown is the
    # cliff, grey stone the stairs, water on the face the waterfall.
    raised = components((x, y) for y in range(rows) for x in range(cols) if d[y][x] in RAISED)
    for part in raised:
        xs, ys = [p[0] for p in part], [p[1] for p in part]
        box = {(x, y) for y in range(max(0, min(ys) - 2), min(rows, max(ys) + 3)) for x in range(max(0, min(xs) - 2), min(cols, max(xs) + 3))}
        tops = components(p for p in box if g[p[1]][p[0]] in (".", ",") and sh["stone"][p[1], p[0]] < 0.3)
        top_draft = {p for p in part if d[p[1]][p[0]] == "^"}
        best = max(tops, key=lambda c: len(c & top_draft), default=set())
        if len(best & top_draft) == 0:
            continue
        for x, y in best:
            g[y][x] = "^"
        for x, y in box:
            if g[y][x] == "^":
                continue
            if sh["stone"][y, x] >= 0.3 and near(g, x, y, "^", 2) and g[y][x] != "~":
                g[y][x] = "s"
            elif g[y][x] == "~" and d[y][x] == "w" or (g[y][x] == "~" and near(d, x, y, "w", 1)):
                g[y][x] = "w"
            elif g[y][x] == "#" and near(g, x, y, "^", 2):
                g[y][x] = "F"
    # Plank bridges: non-water tiles next to water close to the draft's bridges, across the water.
    for y in range(rows):
        for x in range(cols):
            if g[y][x] in ("#", "F") and near(d, x, y, "=", 3) and near(g, x, y, "~w", 1):
                g[y][x] = "="
            elif g[y][x] in (".", ",") and near(d, x, y, "=", 1) and near(g, x, y, "~", 1):
                g[y][x] = "="
    painted_bridges(g, cols, rows)
    tidy(g, cols, rows)
    join_parts(g, sh, cols, rows)
    for x in range(cols):
        for y in (0, rows - 1):
            if g[y][x] != "~":
                g[y][x] = "#"
    for y in range(rows):
        for x in (0, cols - 1):
            if g[y][x] != "~":
                g[y][x] = "#"
    return g


def painted_bridges(g, cols, rows, side=2, span=4):
    """Bridges the painting added: a strip of solid tiles with water or lava close by on a side and ground at both of its
    ends (the planks read as rock by colour, so they are found by their shape)."""
    solid = ("#", "F")
    GROUND = WALK - {"="}

    def run(x, y, dx, dy, limit, want):
        for k in range(1, limit + 1):
            cx, cy = x + dx * k, y + dy * k
            if not (0 <= cx < cols and 0 <= cy < rows):
                return False
            c = g[cy][cx]
            if c in want:
                return True
            if c not in solid and c != "=":
                return False
        return False

    found = []
    for y in range(1, rows - 1):
        for x in range(1, cols - 1):
            if g[y][x] not in solid:
                continue
            for (ax, ay), (bx, by) in (((1, 0), (0, 1)), ((0, 1), (1, 0))):
                # A thin stream may not read as lava on one side, so one wet side is enough.
                wet = run(x, y, ax, ay, side, "~w") or run(x, y, -ax, -ay, side, "~w")
                if wet and run(x, y, bx, by, span, GROUND) and run(x, y, -bx, -by, span, GROUND):
                    found.append((x, y))
                    break
    for x, y in found:
        g[y][x] = "="


def join_parts(g, sh, cols, rows, gap=3, least=4):
    """Joins each cut-off patch of ground to the main one through the shortest straight gap of solid tiles (stairs or a bridge the
    colours missed): a cliff face becomes stairs, rock becomes ground; among equal gaps the brightest (painted steps are light)."""
    while True:
        walk = [(x, y) for y in range(1, rows - 1) for x in range(1, cols - 1) if g[y][x] in WALK]
        parts = sorted(components(walk), key=len, reverse=True)
        main = parts[0] if parts else set()
        best = None
        for part in parts[1:]:
            if len(part) < least:
                continue
            for x, y in part:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    run = []
                    for k in range(1, gap + 2):
                        cx, cy = x + dx * k, y + dy * k
                        if not (0 < cx < cols - 1 and 0 < cy < rows - 1) or g[cy][cx] in ("~", "w"):
                            break
                        if (cx, cy) in main:
                            if run:
                                key = (len(run), -float(np.mean([sh["lum"][ty, tx] for tx, ty in run])))
                                if best is None or key < best[0]:
                                    best = (key, run)
                            break
                        if g[cy][cx] in WALK:
                            break
                        run.append((cx, cy))
        if best is None:
            return
        for x, y in best[1]:
            g[y][x] = "s" if g[y][x] == "F" else "."


def tidy(g, cols, rows):
    for y in range(1, rows - 1):
        for x in range(1, cols - 1):
            around = [g[y + dy][x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy]
            if g[y][x] == "#" and sum(c in WALK for c in around) >= 6:
                g[y][x] = "."
            elif g[y][x] == "." and sum(c in WALK for c in around) <= 1:
                g[y][x] = "#"
            elif g[y][x] == "=" and sum(c == "=" for c in around) < 1:
                g[y][x] = "~" if sum(c == "~" for c in around) >= 4 else "."


def place_exits(g, m, keep):
    cols, rows = m["cols"], m["rows"]
    for e in m["exits"]:
        along = "y" if e["x"] in (0, cols - 1) else "x"
        span = e["h"] if along == "y" else e["w"]
        best = None
        if e["id"] not in keep:
            for d in sorted(range(-6, 7), key=abs):
                x, y = (e["x"], e["y"] + d) if along == "y" else (e["x"] + d, e["y"])
                if not (1 <= (y if along == "y" else x) <= (rows if along == "y" else cols) - 1 - span):
                    continue
                cells = [(x, y + k) if along == "y" else (x + k, y) for k in range(span)]
                if all(g[iy][ix] in WALK for cx, cy in cells for ix, iy in [inward(cx, cy, cols, rows)]):
                    best = (x, y)
                    break
        if best is None:
            best = (e["x"], e["y"])
        e["x"], e["y"] = best
        # The exit's tiles and a trail inward until it meets walkable ground (carved where the picture shows none).
        for k in range(span):
            cx, cy = (e["x"], e["y"] + k) if along == "y" else (e["x"] + k, e["y"])
            g[cy][cx] = ","
            step = (1, 0) if cx == 0 else (-1, 0) if cx == cols - 1 else (0, 1) if cy == 0 else (0, -1)
            x, y = cx + step[0], cy + step[1]
            for _ in range(12):
                if g[y][x] in WALK:
                    break
                g[y][x] = ","
                x, y = x + step[0], y + step[1]


def reach(g, start, blocked=frozenset()):
    rows, cols = len(g), len(g[0])
    seen, todo = {start}, deque([start])
    while todo:
        x, y = todo.popleft()
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= n[0] < cols and 0 <= n[1] < rows and n not in seen and n not in blocked and g[n[1]][n[0]] in WALK:
                seen.add(n)
                todo.append(n)
    return seen


def tiles(o, w=1, h=1):
    return {(o["x"] + i, o["y"] + j) for j in range(h) for i in range(w)}


def guarded(draft):
    """What each element gate of the draft keeps shut: objects one reaches with every gate open but not with that gate shut."""
    g = draft["terrain"]
    sp = (draft["spawn"]["x"], draft["spawn"]["y"])
    things = [(k, o) for k in ("chests", "nodes", "springs", "npcs", "lore", "puzzles") for o in draft[k]] + [("groups", o) for o in draft["groups"]]
    out = {}
    for gate in draft["gates"]:
        shut = reach(g, sp, frozenset(tiles(gate, gate["w"], gate["h"])))
        out[gate["id"]] = [o["id"] for k, o in things if (o["x"], o["y"]) not in shut]
    return out


class Snap:
    def __init__(self, g, m, ok):
        self.g, self.m, self.ok = g, m, ok
        self.taken = set()
        self.spots = [(m["spawn"]["x"], m["spawn"]["y"], 3)] + [(e["x"], e["y"], 3) for e in m["exits"]]
        # Things block their tiles in the game (groups do not): once `start` is set, a solid thing may not cut any ground off.
        self.start, self.solid, self.reached = None, set(), None
        self.loose = False

    def claim(self, x, y, w, h, gap, solid=False):
        for j in range(h):
            for i in range(w):
                self.taken.add((x + i, y + j))
                if solid:
                    self.solid.add((x + i, y + j))
        self.spots.append((x + (w - 1) / 2, y + (h - 1) / 2, gap))
        self.reached = None

    def cuts(self, foot):
        if self.start is None:
            return False
        if self.reached is None:
            self.reached = reach(self.g, self.start, frozenset(self.solid))
        lost = len(foot & self.reached)
        # A few tiles of a dead-end nook may go; nothing larger (things placed later still find room).
        return len(reach(self.g, self.start, frozenset(self.solid | foot))) < len(self.reached) - lost - 4

    def fits(self, x, y, w, h, solid, gap, area):
        for j in range(h):
            for i in range(w):
                t = (x + i, y + j)
                if t in self.taken or t not in area:
                    return False
                c = self.g[t[1]][t[0]]
                if (solid and c not in (WALK - {"=", "s"} if self.loose else OPEN)) or (not solid and c not in WALK - {"=", "s"}):
                    return False
        cx, cy = x + (w - 1) / 2, y + (h - 1) / 2
        if not all(math.hypot(cx - px, cy - py) >= min(gap, g2) for px, py, g2 in self.spots):
            return False
        return not (solid and self.cuts({(x + i, y + j) for j in range(h) for i in range(w)}))

    def near(self, x0, y0, w, h, solid, gap, area):
        try:
            return self.near_on(x0, y0, w, h, solid, gap, area)
        except ValueError:
            if not solid:
                raise
        # No open ground left for it: a solid thing may stand on the trail too (the cut-off rule still holds).
        self.loose = True
        try:
            return self.near_on(x0, y0, w, h, solid, gap, area)
        finally:
            self.loose = False

    def near_on(self, x0, y0, w, h, solid, gap, area):
        for gp in (gap, max(1, gap - 1), 0):
            for r in range(0, 22):
                ring = [(x0 + dx, y0 + dy) for dy in range(-r, r + 1) for dx in range(-r, r + 1) if max(abs(dx), abs(dy)) == r]
                ring.sort(key=lambda p: math.hypot(p[0] - x0, p[1] - y0))
                for x, y in ring:
                    if self.fits(x, y, w, h, solid, gp, area):
                        self.claim(x, y, w, h, gp, solid)
                        return x, y
        raise ValueError(f"no tile near {x0},{y0} for {w}x{h}")


def pocket_cut(g, spawn, must, things):
    """A neck (≤ 7 tiles, a straight run with no ground at either end) that shuts off a pocket of ground holding nothing in `must`,
    big enough for `things` (about six tiles each); the smallest such pocket. Returns (neck tiles, pocket tiles) or None."""
    rows, cols = len(g), len(g[0])
    start = (spawn["x"], spawn["y"])
    whole = reach(g, start)
    best = None
    for x, y in whole:
        for dx, dy in ((1, 0), (0, 1)):
            # Only runs that start against a wall.
            if (x - dx, y - dy) in whole:
                continue
            run = []
            for k in range(7):
                t = (x + dx * k, y + dy * k)
                if t not in whole:
                    break
                run.append(t)
                end = (t[0] + dx, t[1] + dy)
                if end in whole or start in run:
                    continue
                left = reach(g, start, frozenset(run))
                room = whole - left - set(run)
                if len(room) < 6 * things or room & must:
                    continue
                if best is None or len(room) < len(best[1]):
                    best = (list(run), room)
    return best


def gate_cut(g, spawn, inside, must, guard_tiles):
    """The narrowest neck (≤ 7 tiles, a straight run) on the way from the spawn to `inside` whose closing shuts every guarded tile and nothing in `must`."""
    rows, cols = len(g), len(g[0])
    start = (spawn["x"], spawn["y"])
    prev, todo = {start: None}, deque([start])
    target = next(iter(inside))
    while todo:
        p = todo.popleft()
        if p in inside:
            target = p
            break
        for n in ((p[0] + 1, p[1]), (p[0] - 1, p[1]), (p[0], p[1] + 1), (p[0], p[1] - 1)):
            if 0 <= n[0] < cols and 0 <= n[1] < rows and n not in prev and g[n[1]][n[0]] in WALK:
                prev[n] = p
                todo.append(n)
    path = []
    p = target
    while p is not None:
        path.append(p)
        p = prev.get(p)
    best = None
    for i, (x, y) in enumerate(path[1:-2], 1):
        if (x, y) in guard_tiles:
            continue
        px, py = path[i - 1]
        for horiz in ((py == y), (px == x)):
            run = [(x, y)]
            for sgn in (-1, 1):
                k = 1
                while k < 8:
                    q = (x + sgn * k, y) if horiz else (x, y + sgn * k)
                    if not (0 <= q[0] < cols and 0 <= q[1] < rows) or g[q[1]][q[0]] not in WALK:
                        break
                    run.append(q)
                    k += 1
            if len(run) > 7 or any(t in guard_tiles for t in run):
                continue
            shut = reach(g, start, frozenset(run))
            if any(t in shut for t in inside) or not all(t in shut for t in must):
                continue
            if best is None or len(run) < len(best[0]) or (len(run) == len(best[0]) and i < best[1]):
                best = (sorted(run), i)
    return best[0] if best else None


def portal_by(g, spawn, m, area):
    """The portal beside the spawn (one arrives by it there): the nearest 2 × 2 of walkable ground within 4 tiles, open ground
    first, a wide trail if need be, never shutting the way to an exit or cutting off ground."""
    sx, sy = spawn
    exits = [inward(e["x"], e["y"], m["cols"], m["rows"]) for e in m["exits"]]
    best = None
    for y in range(sy - 5, sy + 5):
        for x in range(sx - 5, sx + 5):
            cells = {(x + i, y + j) for j in range(2) for i in range(2)}
            if spawn in cells or not cells <= area or any(g[cy][cx] in ("=", "s") for cx, cy in cells):
                continue
            dist = math.hypot(max(0, x - sx, sx - x - 1), max(0, y - sy, sy - y - 1))
            if dist > 4:
                continue
            on_trail = sum(g[cy][cx] == "," for cx, cy in cells)
            key = (on_trail > 0, dist)
            if best and key >= best[0]:
                continue
            left = reach(g, spawn, frozenset(cells))
            if not all(t in left for t in exits) or len(left) < len(area) - len(cells & area) - 4:
                continue
            best = (key, x, y)
    if not best:
        raise ValueError(f"no room for the portal by the spawn {spawn}")
    return {"x": best[1], "y": best[2]}


def bring(code, art, draft, live, props, keep, batch):
    m = json.loads(json.dumps(draft))
    cols, rows = m["cols"], m["rows"]
    master = Image.open(REPO / "art_inbox" / ".batch" / batch / f"{art}_master.png")
    sh = shares(master, cols, rows, lava=m["zoneId"] == "zone_mountain")
    g = propose(draft["terrain"], sh, cols, rows)
    place_exits(g, m, keep)
    guards = guarded(draft)
    # Spawn and portal first, on open ground near their draft spots.
    walk_all = {(x, y) for y in range(rows) for x in range(cols) if g[y][x] in WALK}
    S = Snap(g, m, None)
    S.spots = [(e["x"], e["y"], 3) for e in m["exits"]]
    sx, sy = S.near(m["spawn"]["x"], m["spawn"]["y"], 1, 1, False, 2, walk_all)
    m["spawn"] = {"x": sx, "y": sy}
    area = reach(g, (sx, sy))
    m["portal"] = portal_by(g, (sx, sy), m, area)
    S.claim(m["portal"]["x"], m["portal"]["y"], 2, 2, 2, True)
    S.start = (sx, sy)
    # Everything else, landmarks first (biggest), then things, then groups.
    order = [("props", o) for o in m["props"]] + ([("shrine", m["shrine"])] if m.get("shrine") else [])
    order += [(k, o) for k in ("chests", "puzzles", "nodes", "springs", "npcs", "lore") for o in m[k]] + [("groups", o) for o in m["groups"]]
    for kind, o in order:
        w, h = (props[o["prop"]]["w"], props[o["prop"]]["h"]) if kind == "props" else (2, 2) if kind == "shrine" else (1, 1)
        o["x"], o["y"] = S.near(o["x"], o["y"], w, h, kind != "groups", 3 if kind == "groups" else 2, area)
    # Element gates on the narrowest neck before what they guarded, as wide as that neck (a bramble or a wall across it).
    objs = {o["id"]: o for k in ("chests", "nodes", "springs", "npcs", "lore", "puzzles", "groups") for o in m[k]}
    report = []
    for gate in m["gates"]:
        inside_ids = guards.get(gate["id"], [])
        inside = {(objs[i]["x"], objs[i]["y"]) for i in inside_ids}
        must = {(m["portal"]["x"], m["portal"]["y"])} | {inward(e["x"], e["y"], cols, rows) for e in m["exits"]}
        must |= {(o["x"], o["y"]) for i, o in objs.items() if i not in inside_ids and o["id"] not in sum(guards.values(), [])}
        cut = gate_cut(g, m["spawn"], inside, must, inside) if inside else None
        if not cut and inside:
            # The painting has no neck before them: find a dead-end pocket behind a neck and move what the gate guards into it.
            pocket = pocket_cut(g, m["spawn"], must | {(o["x"], o["y"]) for i, o in objs.items() if i not in inside_ids}, len(inside_ids))
            if pocket:
                cut, room = pocket
                report.append(f"{code}: {gate['id']} has no neck before its draft spot; {', '.join(inside_ids)} moved into a pocket")
                for i in inside_ids:
                    o = objs[i]
                    fx, fy = min(room, key=lambda t: math.hypot(t[0] - o["x"], t[1] - o["y"]))
                    o["x"], o["y"] = S.near(fx, fy, 1, 1, i in {c["id"] for c in m["chests"]}, 1, room)
        if not cut:
            report.append(f"{code}: no neck found for {gate['id']} (guards {inside_ids})")
            continue
        xs, ys = [c[0] for c in cut], [c[1] for c in cut]
        if len(cut) > 2:
            report.append(f"{code}: {gate['id']} spans a {len(cut)}-tile neck at {min(xs)},{min(ys)}")
        gate["x"], gate["y"], gate["w"], gate["h"] = min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
        for c in cut:
            if g[c[1]][c[0]] not in WALK:
                g[c[1]][c[0]] = ","
    # Covers follow their hidden chest (same offset as in the draft), kept inside the area.
    for c in m["covers"]:
        dc = next((o for o in draft["chests"] if c["x"] <= o["x"] < c["x"] + c["w"] and c["y"] <= o["y"] < c["y"] + c["h"]), None)
        if not dc:
            continue
        nc = objs[dc["id"]]
        c["x"] = max(0, min(cols - c["w"], nc["x"] - (dc["x"] - c["x"])))
        c["y"] = max(0, min(rows - c["h"], nc["y"] - (dc["y"] - c["y"])))
    m["terrain"] = ["".join(r) for r in g]
    W, H = cols * PX, rows * PX
    m["scene"] = {
        "art": art,
        "px": PX,
        "chunks": [math.ceil(W / MAX_CHUNK), math.ceil(H / MAX_CHUNK)],
        "elevation": ["".join("2" if ch == "^" else "0" for ch in row) for row in m["terrain"]],
    }
    return m, report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--batch", required=True)
    ap.add_argument("--keep", default="")
    ap.add_argument("areas", nargs="+", help="CODE:art")
    a = ap.parse_args()
    keep = set(filter(None, a.keep.split(",")))
    live, props = live_maps(), props_by_id()
    finals, reports = {}, []
    for item in a.areas:
        code, art = item.split(":")
        draft = json.loads((REPO / "docs" / "maps" / "v3" / f"{code}_layout_draft.json").read_text(encoding="utf8"))["map"]
        try:
            m, rep = bring(code, art, draft, live, props, keep, a.batch)
        except ValueError as err:
            sh = shares(Image.open(REPO / "art_inbox" / ".batch" / a.batch / f"{art}_master.png"), draft["cols"], draft["rows"], lava=draft["zoneId"] == "zone_mountain")
            grid = propose(draft["terrain"], sh, draft["cols"], draft["rows"])
            raise SystemExit(f"{code}: {err}" + "".join(f"\n{y:2d} {''.join(r)}" for y, r in enumerate(grid))) from None
        finals[code] = m
        FITS[code] = tuple(round(float(v), 3) for v in propose.fit)
        reports += rep
    arrivals = link(finals, live)
    path = REPO / "content" / "adventure" / "maps.json"
    data = json.loads(path.read_text(encoding="utf8"))
    by_id = {m["id"]: m for m in finals.values()}
    for i, m in enumerate(data["maps"]):
        if m["id"] in by_id:
            data["maps"][i] = by_id[m["id"]]
    for key, (x, y) in arrivals.items():
        map_id, exit_id = key.split("/")
        e = next(e for m in data["maps"] if m["id"] == map_id for e in m["exits"] if e["id"] == exit_id)
        e["arriveX"], e["arriveY"] = x, y
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf8", newline="\n")
    for code, m in finals.items():
        (REPO / "docs" / "maps" / "v3" / f"{code}_mask_proposal.txt").write_text("\n".join(m["terrain"]) + "\n", encoding="utf8")
    print("written:", ", ".join(f"{c} {m['id']}" for c, m in finals.items()))
    print("arrivals of other areas:", arrivals)
    print("ground split (agreement with the draft, brightness):", FITS)
    for r in reports:
        print("  !", r)


if __name__ == "__main__":
    main()
