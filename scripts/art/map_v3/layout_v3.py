# The v3 layout kit (docs/maps/v3/M2_PLAN.md §4b): every remade area is a spec — its ground drawn with a few shapes (glades, a raised
# ridge with a cliff face and stairs, ponds, trails, streams that turn into bridges where they cross a trail, necks), its exits, and
# where each gameplay object goes (a fixed tile, or a named area it is placed in automatically). From a set of specs it writes the
# drafts (docs/maps/v3/<code>_layout_draft.json/.txt) with every arrival worked out both ways (also for live neighbours), the hint
# for the image AI (no text), the owner's annotated guide and the batch's PROMPT.md. Check the drafts with
# `npx tsx scripts/art/map_v3/check_draft.ts <codes...>`. Tooling only; ids, counts, kinds and behaviour of every object are kept
# (asserted against content/adventure/maps.json).
import json
import math
import random
import shutil
from pathlib import Path

from PIL import Image, ImageDraw

from m2_hints import font, grid_over, objects_over, plan, scale_hint

REPO = Path(__file__).resolve().parents[3]
DOCS = REPO / "docs" / "maps" / "v3"
WALK = set(".,=^sc")
# Where a standing thing may stand: open ground only (never on a trail, a bridge or stairs, so it never shuts a way).
OPEN = set(".^c")


def live_maps():
    return {m["id"]: m for m in json.loads((REPO / "content" / "adventure" / "maps.json").read_text(encoding="utf8"))["maps"]}


def props_by_id():
    return {p["id"]: p for p in json.loads((REPO / "content" / "adventure" / "props.json").read_text(encoding="utf8"))["props"]}


class Grid:
    def __init__(self, cols, rows, seed):
        self.cols, self.rows = cols, rows
        self.g = [["#"] * cols for _ in range(rows)]
        self.rng = random.Random(seed)

    def inside(self, x, y):
        return 0 <= x < self.cols and 0 <= y < self.rows

    def set(self, x, y, c):
        if self.inside(x, y):
            self.g[y][x] = c

    def blob(self, cx, cy, rx, ry, c=".", wobble=0.18):
        """A rounded patch with a wobbly rim (glades, ponds, islands)."""
        ph = [self.rng.uniform(0, math.tau) for _ in range(3)]
        for y in range(self.rows):
            for x in range(self.cols):
                a = math.atan2((y - cy) / ry, (x - cx) / rx)
                r = 1 + wobble * (math.sin(3 * a + ph[0]) * 0.5 + math.sin(5 * a + ph[1]) * 0.3 + math.sin(2 * a + ph[2]) * 0.2)
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= r * r:
                    self.g[y][x] = c

    def band(self, pts, width):
        cells = set()
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = int(max(abs(x1 - x0), abs(y1 - y0)) * 3) + 1
            for i in range(n + 1):
                x, y = x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n
                h = width / 2
                for yy in range(math.floor(y - h + 0.5), math.floor(y + h + 0.5)):
                    for xx in range(math.floor(x - h + 0.5), math.floor(x + h + 0.5)):
                        if self.inside(xx, yy):
                            cells.add((xx, yy))
        return cells

    def trail(self, pts, width):
        """A trail; it stops at raised ground, cliffs, stairs and water (a stream drawn later makes the bridge)."""
        for x, y in self.band(pts, width):
            if self.g[y][x] not in ("^", "F", "s", "~", "w"):
                self.g[y][x] = ","

    def stream(self, pts, width):
        """Water along the points; a trail it crosses becomes a plank bridge."""
        for x, y in self.band(pts, width):
            if self.g[y][x] in ("^", "F", "s"):
                continue
            self.g[y][x] = "=" if self.g[y][x] in (",", "=") else "~"

    def ridge(self, cx, cy, rx, ry, stairs, front=2):
        """A raised top (^) with a one-tile steep rim (F) on its sides and back, a cliff face `front` tiles deep on its south side, and
        stone stairs (s) cut through the face at the columns in `stairs` (each landing on open ground below)."""
        top = {(x, y) for y in range(self.rows) for x in range(self.cols) if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1}
        for x, y in top:
            self.g[y][x] = "^"
        for x, y in top:
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (-1, -1), (1, -1)):
                if (x + dx, y + dy) not in top:
                    self.set(x + dx, y + dy, "F")
            if (x, y + 1) not in top:
                for k in range(1, front + 1):
                    self.set(x, y + k, "F")
        for sx in stairs:
            bottom = max(y for x, y in top if x == sx)
            for k in range(1, front + 1):
                self.set(sx, bottom + k, "s")
            if self.inside(sx, bottom + front + 1) and self.g[bottom + front + 1][sx] not in WALK:
                self.set(sx, bottom + front + 1, ".")

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.set(x, y, c)

    def tidy(self):
        for y in range(1, self.rows - 1):
            for x in range(1, self.cols - 1):
                around = [self.g[y + dy][x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy]
                if self.g[y][x] == "#" and sum(c in WALK for c in around) >= 6:
                    self.g[y][x] = "."
                if self.g[y][x] == "=" and sum(c == "=" for c in around) < 2:
                    self.g[y][x] = "~"

    def rows_(self):
        return ["".join(r) for r in self.g]


def run_ops(spec, cols, rows):
    G = Grid(cols, rows, spec["seed"])
    ops = spec["ground"]
    # Order: open ground and ponds, raised ridges, trails, streams, hand rects (necks, waterfalls), then tidy and the edge.
    for op in ops:
        if op[0] == "glade":
            G.blob(*op[1:5], ".")
        elif op[0] == "pond":
            G.blob(*op[1:5], "~", wobble=0.12)
    for op in ops:
        if op[0] == "island":
            G.blob(*op[1:5], ".")
    for op in ops:
        if op[0] == "ridge":
            G.ridge(*op[1:])
    for op in ops:
        if op[0] == "trail":
            G.trail(op[1], op[2])
    for op in ops:
        if op[0] == "stream":
            G.stream(op[1], op[2])
    for op in ops:
        if op[0] == "sandbar":
            for x, y in G.band(op[1], op[2]):
                if G.g[y][x] in ("~", "#"):
                    G.g[y][x] = "."
    for op in ops:
        if op[0] == "boardwalk":
            for x, y in G.band(op[1], op[2]):
                if G.g[y][x] not in ("^", "F", "s"):
                    G.g[y][x] = "=" if G.g[y][x] in ("~", "w") else ","
    G.tidy()
    for op in ops:
        if op[0] == "rect":
            G.rect(*op[1:])
    # The frame is shut (water may run off it); the exits open it again below.
    for x in range(cols):
        for y in (0, rows - 1):
            if G.g[y][x] != "~":
                G.g[y][x] = "#"
    for y in range(rows):
        for x in (0, cols - 1):
            if G.g[y][x] != "~":
                G.g[y][x] = "#"
    for x, y, w, h in spec["exits"].values():
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                G.g[yy][xx] = ","
        # The tile just inside stays a trail, so an arrival lands on it.
        ix, iy = inward(x, y, cols, rows)
        for yy in range(iy, iy + h):
            for xx in range(ix, ix + w):
                if G.g[yy][xx] not in WALK:
                    G.g[yy][xx] = ","
    for x, y in spec.get("corrupted", []):
        if G.g[y][x] == ".":
            G.g[y][x] = "c"
    return G.rows_()


def inward(x, y, cols, rows):
    if x == 0:
        return 1, y
    if x == cols - 1:
        return cols - 2, y
    if y == 0:
        return x, 1
    return x, rows - 2


class Placer:
    """Puts the objects not fixed by hand into their named areas: open ground, away from each other, the exits and the spawn."""

    def __init__(self, terrain, spec, props):
        self.t = terrain
        self.rows, self.cols = len(terrain), len(terrain[0])
        self.taken = set()
        # Tiles a standing thing blocks: a new one may never cut part of the area off (a statue across a sand spit, a lighthouse on
        # top of the stairs).
        self.solid = set()
        self.spots = []
        self.rng = random.Random(spec["seed"] + 1)
        sx, sy = spec["spawn"]
        self.spawn = (sx, sy)
        self.spots.append((sx, sy, 4))
        for x, y, w, h in spec["exits"].values():
            self.spots.append((x + w / 2, y + h / 2, 4))
        self.props = props

    def claim(self, x, y, w, h, gap, solid=False):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.taken.add((xx, yy))
                if solid:
                    self.solid.add((xx, yy))
        self.spots.append((x + (w - 1) / 2, y + (h - 1) / 2, gap))

    def reach(self, blocked):
        seen, todo = {self.spawn}, [self.spawn]
        while todo:
            x, y = todo.pop()
            for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if n not in seen and n not in blocked and 0 <= n[0] < self.cols and 0 <= n[1] < self.rows and self.t[n[1]][n[0]] in WALK:
                    seen.add(n)
                    todo.append(n)
        return len(seen)

    def fits(self, x, y, w, h, solid, gap):
        for yy in range(y - (1 if solid else 0), y + h + (1 if solid else 0)):
            for xx in range(x - (1 if solid else 0), x + w + (1 if solid else 0)):
                if not (1 <= xx < self.cols - 1 and 1 <= yy < self.rows - 1):
                    return False
                inner = x <= xx < x + w and y <= yy < y + h
                c = self.t[yy][xx]
                if inner and ((solid and c not in OPEN) or (not solid and c not in WALK - {"=", "s"}) or (xx, yy) in self.taken):
                    return False
        cx, cy = x + (w - 1) / 2, y + (h - 1) / 2
        return all(math.hypot(cx - px, cy - py) >= max(gap, g) for px, py, g in self.spots)

    def place(self, box, w, h, solid, gap):
        x0, y0, x1, y1 = box
        cells = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        cells.sort(key=lambda p: math.hypot(p[0] - cx, p[1] - cy) + self.rng.random() * 2.5)
        base = self.reach(self.solid) if solid else 0
        for g in (gap, gap - 1, max(1, gap - 2)):
            for x, y in cells:
                if not self.fits(x, y, w, h, solid, g):
                    continue
                if solid:
                    cells_here = {(x + i, y + j) for j in range(h) for i in range(w)}
                    if self.reach(self.solid | cells_here) < base - w * h:
                        continue
                self.claim(x, y, w, h, g, solid)
                return x, y
        raise ValueError(f"nothing fits {w}x{h} in {box}")


def draft(spec, live, props):
    old = live[spec["map"]]
    m = json.loads(json.dumps(old))
    cols, rows = m["cols"], m["rows"]
    m["terrain"] = run_ops(spec, cols, rows)
    m["spawn"] = {"x": spec["spawn"][0], "y": spec["spawn"][1]}
    m["portal"] = {"x": spec["portal"][0], "y": spec["portal"][1]}
    for e in m["exits"]:
        e["x"], e["y"], e["w"], e["h"] = spec["exits"][e["id"]]
    P = Placer(m["terrain"], spec, props)
    P.claim(spec["portal"][0], spec["portal"][1], 2, 2, 3, True)
    fixed, auto = spec.get("fixed", {}), spec.get("place", {})
    areas = {a[0]: a[2] for a in spec["areas"]}
    for c in m["covers"]:
        c["x"], c["y"], c["w"], c["h"] = fixed[c["id"]]
    # Fixed first (they claim their tiles), then the big things, then the rest in spec order.
    def size(kind, o):
        if kind == "props":
            p = props[o["prop"]]
            return p["w"], p["h"]
        if kind == "gates":
            return o["w"], o["h"]
        if kind == "shrine":
            return 2, 2
        return 1, 1

    entries = []
    for kind in ("props", "gates", "chests", "nodes", "puzzles", "springs", "npcs", "lore", "groups"):
        for o in m[kind]:
            entries.append((kind, o))
    if m.get("shrine"):
        entries.insert(1, ("shrine", m["shrine"]))
    key = lambda kind, o: o.get("id", o.get("prop"))
    for kind, o in entries:
        k = key(kind, o)
        if k in fixed:
            f = fixed[k]
            o["x"], o["y"] = f[0], f[1]
            if kind == "gates" and len(f) == 4:
                o["w"], o["h"] = f[2], f[3]
            w, h = size(kind, o)
            P.claim(o["x"], o["y"], w, h, 3 if kind == "groups" else 2, kind not in ("groups", "gates"))
    # Things first, then the element gates the spec sets on a neck (`gate_in`: what area they shut), then the groups around them.
    gate_in = spec.get("gate_in", {})
    things = [(kind, o) for kind, o in entries if kind not in ("groups", "gates") or (kind == "gates" and key(kind, o) not in gate_in)]
    groups = [(kind, o) for kind, o in entries if kind == "groups"]
    for kind, o in things + [("gate_in", None)] + groups:
        if kind == "gate_in":
            neck_gates(m, gate_in, areas, P, spec["code"])
            continue
        k = key(kind, o)
        if k in fixed:
            continue
        if k not in auto:
            raise KeyError(f"{spec['code']}: {k} has no place")
        w, h = size(kind, o)
        try:
            o["x"], o["y"] = P.place(areas[auto[k]], w, h, kind != "groups", 4 if kind == "groups" else 3)
        except ValueError as err:
            x0, y0, x1, y1 = areas[auto[k]]
            view = "".join(f"\n  {y:2d} " + m["terrain"][y][x0 : x1 + 1] for y in range(y0, y1 + 1))
            raise ValueError(f"{spec['code']}: {k} ({auto[k]}): {err}{view}") from None
    return m


def neck_gates(m, gate_in, areas, P, code):
    """Each gate of `gate_in` on the narrowest neck between the spawn and the things placed in its area (layout_v3 drafts)."""
    from import_v3 import gate_cut

    things = [o for k in ("chests", "nodes", "springs", "npcs", "lore", "puzzles") for o in m[k]]
    for gate in m["gates"]:
        if gate["id"] not in gate_in:
            continue
        x0, y0, x1, y1 = areas[gate_in[gate["id"]]]
        inside = {(o["x"], o["y"]) for o in things if x0 <= o["x"] <= x1 and y0 <= o["y"] <= y1}
        if not inside:
            raise ValueError(f"{code}: nothing placed in {gate_in[gate['id']]} for {gate['id']}")
        must = {(m["portal"]["x"], m["portal"]["y"])} | {inward(e["x"], e["y"], m["cols"], m["rows"]) for e in m["exits"]}
        must |= {(o["x"], o["y"]) for o in things if (o["x"], o["y"]) not in inside}
        cut = gate_cut(m["terrain"], m["spawn"], inside, must, inside | P.taken)
        if not cut:
            raise ValueError(f"{code}: no neck of 7 tiles or less before {gate_in[gate['id']]} for {gate['id']}")
        xs, ys = [c[0] for c in cut], [c[1] for c in cut]
        gate["x"], gate["y"], gate["w"], gate["h"] = min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
        P.claim(gate["x"], gate["y"], gate["w"], gate["h"], 1)


def link(drafts, live):
    """Every exit's arrival, both ways: the tile just inside the matching exit on the other side (a draft, else the live map)."""
    world = {**live, **{m["id"]: m for m in drafts.values()}}
    ids = {m["id"] for m in drafts.values()}
    arrivals = {}
    for m in world.values():
        for e in m["exits"]:
            if m["id"] not in ids and e["to"] not in ids:
                continue
            other = world[e["to"]]
            back = next((b for b in other["exits"] if b["to"] == m["id"]), None)
            if not back:
                continue
            on_edge = back["x"] in (0, other["cols"] - 1) or back["y"] in (0, other["rows"] - 1)
            if not on_edge:
                continue
            ax, ay = inward(back["x"], back["y"], other["cols"], other["rows"])
            if (e["arriveX"], e["arriveY"]) == (ax, ay):
                continue
            e["arriveX"], e["arriveY"] = ax, ay
            if m["id"] not in ids:
                arrivals[f"{m['id']}/{e['id']}"] = (ax, ay)
    return arrivals


def check_counts(m, old, props):
    for kind in ("groups", "chests", "gates", "covers", "springs", "npcs", "lore", "exits", "props", "puzzles", "nodes"):
        assert [o.get("id", o.get("prop")) for o in m[kind]] == [o.get("id", o.get("prop")) for o in old[kind]], (m["id"], kind)
    assert bool(m.get("shrine")) == bool(old.get("shrine"))


def write_draft(code, m, arrivals, spec):
    DOCS.mkdir(parents=True, exist_ok=True)
    (DOCS / f"{code}_layout_draft.json").write_text(json.dumps({"map": m, "arrivals": arrivals}, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    lines = [f"# {code} {m['id']} — {m['nameVi']}, layout v3 DRAFT ({m['cols']} x {m['rows']}), scripts/art/map_v3/layout_v3.py", f"# {spec['idea']}", "", "grid:"]
    lines += m["terrain"]
    lines += ["", "objects (kind id x y):", f"  spawn {m['spawn']['x']} {m['spawn']['y']}", f"  portal {m['portal']['x']} {m['portal']['y']}"]
    for e in m["exits"]:
        lines.append(f"  exit {e['id']} {e['x']} {e['y']} {e['w']}x{e['h']} -> {e['to']} (arrive there {e['arriveX']},{e['arriveY']})")
    for kind in ("groups", "chests", "nodes", "gates", "puzzles", "covers", "springs", "npcs", "lore"):
        for o in m[kind]:
            extra = f" {o['w']}x{o['h']}" if "w" in o else ""
            lines.append(f"  {kind} {o['id']} {o['x']} {o['y']}{extra}")
    if m.get("shrine"):
        lines.append(f"  shrine {m['shrine']['id']} {m['shrine']['x']} {m['shrine']['y']}")
    for p in m["props"]:
        lines.append(f"  prop {p['prop']} {p['x']} {p['y']}")
    (DOCS / f"{code}_layout_draft.txt").write_text("\n".join(lines) + "\n", encoding="utf8")


def routes_and_areas(img, px, spec, cols, rows):
    over = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    colours = {"start": (90, 200, 255), "combat": (255, 90, 90), "landmark": (255, 210, 60), "secret": (190, 120, 255), "reward": (120, 255, 160), "boss": (255, 140, 0)}
    for name, label, (x0, y0, x1, y1), role in [(a[0], a[1], a[2], a[3]) for a in spec["areas"]]:
        c = colours.get(role, (255, 255, 255))
        d.rounded_rectangle([x0 * px, y0 * px, (x1 + 1) * px, (y1 + 1) * px], radius=px, outline=c + (230,), width=3)
        d.text((x0 * px + 8, y0 * px + 6), f"{role.upper()}: {label}", fill=c + (255,), font=font(18, True), stroke_width=3, stroke_fill=(0, 0, 0, 255))
    for op in spec["ground"]:
        if op[0] == "trail":
            pts = [((x + 0.5) * px, (y + 0.5) * px) for x, y in op[1]]
            d.line(pts, fill=(230, 30, 30, 230) if op[2] >= 3 else (255, 150, 0, 230), width=7 if op[2] >= 3 else 4)
    return Image.alpha_composite(img.convert("RGBA"), over)


def hints(code, m, spec, world, batch):
    batch.mkdir(parents=True, exist_ok=True)
    (batch / "guide").mkdir(exist_ok=True)
    # 32 px / tile for the image AI, keeping the area's own ratio.
    plan(m, 32).save(batch / f"{code}_layout_hint.png")
    big = plan(m, 40)
    annotated = objects_over(routes_and_areas(grid_over(big, 40, m["cols"], m["rows"]), 40, spec, m["cols"], m["rows"]), m, world, 40)
    annotated.convert("RGB").save(batch / "guide" / f"{code}_guide_annotated.png")


def edge_note(e, cols, rows):
    if e["x"] == 0:
        return f"the LEFT edge, {round(100 * (e['y'] + e['h'] / 2) / rows)} % down from the top"
    if e["x"] == cols - 1:
        return f"the RIGHT edge, {round(100 * (e['y'] + e['h'] / 2) / rows)} % down from the top"
    if e["y"] == 0:
        return f"the TOP edge, {round(100 * (e['x'] + e['w'] / 2) / cols)} % across from the left"
    return f"the BOTTOM edge, {round(100 * (e['x'] + e['w'] / 2) / cols)} % across from the left"


def ratio_note(cols, rows):
    r = cols / rows
    return "16:9" if abs(r - 16 / 9) < 0.02 else f"{cols}:{rows} (as close as you can, e.g. 16:9)"


PROMPT_HEAD = """# Batch {batch} — {zone_vi}, layout v3: nền liên tục 3/4 (decision 046)

Viết bởi `scripts/art/map_v3/{script}` (bộ công cụ `layout_v3.py`). Kế hoạch: `docs/maps/v3/M2_PLAN.md` §4b; M2 đã làm ở batch `adventure-15-m2-3q`.

Thư mục làm việc: `art_inbox/.batch/{batch}/`.

| File | Dùng cho |
|---|---|
| `1_style.png` | ảnh phong cách (đính kèm mọi sheet) |
| `M2_done.png` | nền M2 đã duyệt: **mẫu độ hoàn thiện, phối cảnh, tỉ lệ** (đính kèm mọi sheet) |
| `<mã>_layout_hint.png` | mặt bằng mới của từng map, **không chữ** |
| `guide/<mã>_guide_annotated.png` | **chỉ để anh/chị xem** (lưới 40 px, khu, tuyến, id, lối ra) — không đính kèm Gemini |

## Cách làm

1. Gemini web, **cuộc trò chuyện mới cho mỗi map**, chọn độ phân giải **cao nhất** có (2K / 4K nếu có).
2. Đính kèm đúng thứ tự: `1_style.png`, `M2_done.png`, `<mã>_layout_hint.png` → dán prompt → tải **PNG gốc**.
3. Lưu đúng tên `<mã>_BG.png` (ví dụ `M1_BG.png`); phiên bản khác: `M1_BG-2.png`.
4. Không cắt, không chỉnh. Agent xóa dấu sao, phóng, chia khối, đề xuất mask, đặt lại đối tượng (giữ id).

Props (cây, bụi, landmark, tán che) chưa làm ở batch này: sẽ đặt bằng màn Admin "Cập nhật bản đồ" sau.
"""

PROMPT_MAP = """
---

## {code} — {name} (`{map_id}`, {cols} × {rows} ô, tha hóa {corr} %)

- Lưu thành: `art_inbox/.batch/{batch}/{code}_BG.png`
- Đính kèm: `1_style.png`, `M2_done.png`, `{code}_layout_hint.png`
- Tỉ lệ: {ratio}. Kiểm tra trước khi gửi agent: {checks}; không cây đứng lẻ giữa bãi trống, không rương / người / quái / chữ / màu tím.

```text
Image 1 is the STYLE REFERENCE: copy its art style exactly: smoothly painted, crisp, finely detailed digital illustration with soft gradients (NOT pixel art); thin dark outlines; tiny details everywhere. Do NOT copy its layout, its objects or its colours where this map's colours differ.
Image 2 is a FINISHED MAP of the same game: match its finish, its high 3/4 view, its light and its scale exactly (trees, cliffs, trails, bridges at the same size). Do NOT copy its layout or its place.

Image 3 is the GROUND PLAN of the map I need. Keep its framing and the position, size and shape of every area exactly, so the picture lines up with my game grid ({cols} squares wide, {rows} tall; one square is the ground space of one character). Repaint it as a real place with natural, irregular, organic edges; never show squares, a grid or the flat plan colours. Colour key of image 3:
{key}{extra_key}.
{rules}
THIS MAP: {idea}

VIEW: the same high 3/4 view as image 2, a parallel projection from above and from the south. No vanishing point, no isometric diamond angle.
LIGHT: soft warm sunlight from the upper left; short soft shadows toward the lower right.
MOOD: {mood}
ONLY THE FIXED GROUND: no standalone trees in open areas, no single bushes or boulders, no logs, no buildings, no stone circles, no statues, no shrines, no signs, no chests, no characters, no animals, no monsters, no purple or dark corruption, no glow, no particles, no fog, no UI, no text, no letters, no numbers, no border or frame, no grid lines.

Draw ONE wide image at the highest resolution you can, filling the whole frame edge to edge, exactly framed like image 3.
```
"""


FOREST_ZONE = {
    "vi": "vùng Rừng",
    "key": """- dark green = dense deep forest, impassable: tightly packed trees seen in 3/4, canopy tops from above and, along their lower (south-facing) edges, a front of trunks, roots, ferns and shaded undergrowth casting soft shade onto the ground;
- light green = open forest floor, glades and meadows;
- tan = winding dirt trails, 2 to 3 squares wide, soft worn edges; they run off the picture's edges exactly where the plan shows;
- blue = water (streams, ponds{water_extra}) with natural banks, reeds and lily pads; brown planks = simple wooden plank bridges""",
    "ridge": "light olive area ringed in brown = a raised mossy ridge: flat grassy top about two storeys up, an earthy rock cliff face (seen from the front, two squares tall) on its south side, the pale striped patch = stone stairs cut into that face, steep rounded mossy slopes on its other sides",
}


def write_prompt(batch_name, batch, entries, zone=FOREST_ZONE, script="forest_v3.py"):
    text = PROMPT_HEAD.format(batch=batch_name, zone_vi=zone["vi"], script=script)
    for code, m, spec in entries:
        terrain = "".join(m["terrain"])
        extra = ""
        if "^" in terrain:
            extra += "; " + zone["ridge"]
        if "w" in terrain:
            extra += "; pale blue stripes on a cliff face = a waterfall pouring down that face into foaming water"
        checks = "; ".join(f"lối mòn chạm {edge_note(e, m['cols'], m['rows'])}".replace("the LEFT edge", "mép trái").replace("the RIGHT edge", "mép phải").replace("the TOP edge", "mép trên").replace("the BOTTOM edge", "mép dưới").replace("down from the top", "từ trên").replace("across from the left", "từ trái") for e in m["exits"])
        text += PROMPT_MAP.format(
            code=code, name=m["nameVi"], map_id=m["id"], cols=m["cols"], rows=m["rows"], corr=m["corruption"], batch=batch_name,
            ratio=ratio_note(m["cols"], m["rows"]), checks=checks, idea=spec["idea"], mood=spec["mood"],
            extra_key=extra, key=zone["key"].format(water_extra=spec.get("water_extra", ""), inside=spec.get("inside", zone.get("inside", ""))),
            rules="\n" + zone["rules"] + "\n" if "rules" in zone else "",
        )
    (batch / "PROMPT.md").write_text(text, encoding="utf8")


def build_all(specs, batch_name, zone=FOREST_ZONE, script="forest_v3.py"):
    live, props = live_maps(), props_by_id()
    drafts = {}
    for spec in specs:
        m = draft(spec, live, props)
        check_counts(m, live[spec["map"]], props)
        drafts[spec["code"]] = m
    arrivals = link(drafts, live)
    batch = REPO / "art_inbox" / ".batch" / batch_name
    batch.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(REPO / "art_inbox" / ".batch" / "adventure-15-m2-3q" / "1_style.png", batch / "1_style.png")
    shutil.copyfile(REPO / "art_inbox" / ".batch" / "adventure-15-m2-3q" / "BG.png", batch / "M2_done.png")
    world = {**live, **{m["id"]: m for m in drafts.values()}}
    for spec in specs:
        code = spec["code"]
        write_draft(code, drafts[code], arrivals, spec)
        hints(code, drafts[code], spec, world, batch)
    write_prompt(batch_name, batch, [(s["code"], drafts[s["code"]], s) for s in specs], zone, script)
    return drafts, arrivals
