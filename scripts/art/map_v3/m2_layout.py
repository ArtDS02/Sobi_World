# The new ground plan of M2 Rừng Sâu (map_forest_deep) for the 3/4 pilot (docs/maps/v3/M2_PLAN.md §4): a fresh layout, not the v2 one,
# with every gameplay id, count, kind and behaviour of maps.json kept and put somewhere new. It is a DRAFT: the painting is made from
# it, then the walk mask is authored again over the painting (Lượt 2). Writes docs/maps/v3/M2_layout_draft.json (a maps.json entry)
# and docs/maps/v3/M2_layout_draft.txt (grid + objects). Usage: python scripts/art/map_v3/m2_layout.py   (from the repo root)
import json
import math
import random
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
OUT = REPO / "docs" / "maps" / "v3"
MAP_ID = "map_forest_deep"
COLS, ROWS = 64, 36

# Areas of the plan (tiles: x0, y0, x1, y1), their role and colour on the guide.
AREAS = [
    ("START", "Starting glade (spawn, portal, spring)", (1, 16, 13, 27), (90, 200, 255)),
    ("LANDMARK", "Mossy ridge + stone ring + shrine", (6, 1, 25, 12), (255, 210, 60)),
    ("SECRET", "Vine glade (silver chest)", (25, 0, 36, 8), (190, 120, 255)),
    ("COMBAT A", "Pond meadow", (24, 9, 41, 19), (255, 90, 90)),
    ("COMBAT B", "North-east meadow", (44, 1, 62, 11), (255, 90, 90)),
    ("SPECIAL", "Hollow-oak clearing", (30, 16, 47, 28), (255, 210, 60)),
    ("COMBAT C", "East meadow (guardian ahead)", (47, 11, 62, 24), (255, 90, 90)),
    ("SECRET", "Hidden grove (canopy)", (50, 24, 63, 34), (190, 120, 255)),
    ("REWARD", "Boulder pocket (wood chest)", (3, 27, 14, 35), (120, 255, 160)),
    ("COMBAT D", "Lower stream bank", (14, 24, 30, 35), (255, 90, 90)),
    ("EXIT", "W -> M1", (0, 19, 3, 25), (255, 255, 255)),
    ("EXIT", "E -> M3 (guardian)", (59, 5, 64, 10), (255, 255, 255)),
    ("EXIT", "S -> N5 tunnel", (41, 31, 48, 36), (255, 255, 255)),
]
# Routes (tile centres): two main ways from the west to the guardian, the side branches, the hidden way under the canopy.
MAIN = [
    [(0, 21.5), (9, 21.5), (17, 20), (24, 21), (31, 22), (38, 21), (46, 18), (52, 13), (58, 8.5), (63.5, 7.5)],
    [(17, 20), (19, 14), (26, 11.5), (35, 10), (43, 8.5), (51, 7.5), (58, 8.5)],
]
SECONDARY = [
    [(19, 14), (16, 12), (15.5, 10.5)],
    [(31, 9), (31, 5.5), (31, 3)],
    [(38, 21), (42, 27), (44.5, 35.5)],
    [(9, 23), (9, 28), (8.5, 32)],
    [(20, 22), (19, 27), (19, 30)],
]
HIDDEN = [[(55, 21), (56, 26), (58, 30)]]


class Grid:
    def __init__(self):
        self.g = [["#"] * COLS for _ in range(ROWS)]
        self.rng = random.Random(4402)

    def set(self, x, y, c):
        if 0 <= x < COLS and 0 <= y < ROWS:
            self.g[y][x] = c

    def blob(self, cx, cy, rx, ry, c, wobble=0.18):
        """A rounded patch with a wobbly rim (natural clearings, ponds)."""
        phase = [self.rng.uniform(0, math.tau) for _ in range(3)]
        for y in range(ROWS):
            for x in range(COLS):
                a = math.atan2((y - cy) / ry, (x - cx) / rx)
                r = 1 + wobble * (math.sin(3 * a + phase[0]) * 0.5 + math.sin(5 * a + phase[1]) * 0.3 + math.sin(2 * a + phase[2]) * 0.2)
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= r * r:
                    self.set(x, y, c)

    def line(self, pts, c, width, keep=()):
        """A winding band through the points (trails, the stream), `width` tiles across; `keep` chars are not painted over."""
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = int(max(abs(x1 - x0), abs(y1 - y0)) * 3) + 1
            for i in range(n + 1):
                x = x0 + (x1 - x0) * i / n
                y = y0 + (y1 - y0) * i / n
                h = width / 2
                for yy in range(math.floor(y - h + 0.5), math.floor(y + h + 0.5)):
                    for xx in range(math.floor(x - h + 0.5), math.floor(x + h + 0.5)):
                        if 0 <= xx < COLS and 0 <= yy < ROWS and self.g[yy][xx] not in keep:
                            self.g[yy][xx] = c

    def stream(self, pts, width):
        """Water along the points; a trail it crosses becomes a bridge."""
        cells = set()
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = int(max(abs(x1 - x0), abs(y1 - y0)) * 3) + 1
            for i in range(n + 1):
                x = x0 + (x1 - x0) * i / n
                y = y0 + (y1 - y0) * i / n
                h = width / 2
                for yy in range(math.floor(y - h + 0.5), math.floor(y + h + 0.5)):
                    for xx in range(math.floor(x - h + 0.5), math.floor(x + h + 0.5)):
                        cells.add((xx, yy))
        for x, y in cells:
            if 0 <= x < COLS and 0 <= y < ROWS:
                self.g[y][x] = "=" if self.g[y][x] in (",", "=") else "~"

    def rows(self):
        return ["".join(r) for r in self.g]


def build():
    G = Grid()
    # Open ground: the glades and meadows, joined below by the trails.
    G.blob(7, 22, 6, 4.6, ".")  # starting glade
    G.blob(15, 7, 9, 5, ".")  # foot of the ridge (the ridge top is painted over it)
    G.blob(31, 3.2, 4, 2.2, ".")  # vine glade
    G.blob(32, 13, 8.5, 5, ".")  # pond meadow
    G.blob(52, 6, 8, 4.4, ".")  # north-east meadow
    G.blob(38.5, 22, 8, 5.2, ".")  # hollow-oak clearing
    G.blob(54.5, 17, 6.5, 5.5, ".")  # east meadow
    G.blob(57.5, 29.5, 4.8, 3.2, ".")  # hidden grove
    G.blob(8.5, 31, 4.2, 2.6, ".")  # boulder pocket
    G.blob(22, 29.5, 6.5, 4, ".")  # lower stream bank
    # The mossy ridge: a rounded raised top (^) two storeys high; its south face a cliff band (F) two tiles deep with stairs (s) in the
    # middle; its sides and back a one-tile steep slope (F).
    top = set()
    for y in range(ROWS):
        for x in range(COLS):
            if ((x - 15) / 6.6) ** 2 + ((y - 5.6) / 3.3) ** 2 <= 1:
                top.add((x, y))
    for x, y in top:
        G.set(x, y, "^")
    for x, y in top:
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (-1, -1), (1, -1)):
            if (x + dx, y + dy) not in top:
                G.set(x + dx, y + dy, "F")
        if (x, y + 1) not in top:
            G.set(x, y + 1, "F")
            G.set(x, y + 2, "F")
    for y in (9, 10):
        G.set(15, y, "s")
        G.set(16, y, "s")
    # The pond, then the trails (3 wide on the main ways, 2 on the side ways; they stop at the ridge and the pond), then the stream
    # (2 wide, in from the north edge, through the pond, out at the south edge): where it crosses a trail it becomes a plank bridge.
    G.blob(32.5, 13, 4.5, 2.6, "~", wobble=0.12)
    keep = ("^", "F", "s", "~")
    for r in MAIN:
        G.line(r, ",", 3, keep)
    for r in SECONDARY:
        G.line(r, ",", 2, keep)
    G.stream([(39.5, 0), (39.5, 11), (37, 12.5)], 2)
    G.stream([(31, 15), (27, 18), (24.5, 23), (22.5, 28), (20, 36)], 2)
    # The narrow ways into the secrets: one tile through the forest.
    for y in range(5, 10):
        for x in (29, 30, 32, 33):
            if y in (6, 7):
                G.set(x, y, "#")
        G.set(31, y, ",")
    for y in range(26, 30):
        G.set(9, y, ",")
    # The hidden way under the canopy (walkable forest floor).
    G.line(HIDDEN[0], ".", 2)
    # Exits' tiles on the edge.
    for y in (21, 22):
        G.set(0, y, ",")
    for y in (7, 8):
        G.set(63, y, ",")
    for x in (44, 45):
        G.set(x, 35, ",")
    # Umbraflux has crept into the east of the hollow-oak clearing (walkable corrupted ground).
    for (x, y) in [(43, 23), (44, 23), (44, 24), (45, 24), (43, 24), (45, 25), (44, 25)]:
        if G.g[y][x] in (".", ","):
            G.set(x, y, "c")
    # Tidy: a lone forest tile inside open ground opens; a lone bridge plank in a pond is water.
    walk = set(".,=^sc")
    for y in range(1, ROWS - 1):
        for x in range(1, COLS - 1):
            around = [G.g[y + dy][x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy]
            if G.g[y][x] == "#" and sum(c in walk for c in around) >= 6:
                G.set(x, y, ".")
            if G.g[y][x] == "=" and sum(c == "=" for c in around) < 2:
                G.set(x, y, "~")
    return G.rows()


OBJECTS = {
    "spawn": {"x": 2, "y": 21},
    "portal": {"x": 5, "y": 24},
    "exits": [
        {"id": "exit_f2_west", "x": 0, "y": 21, "w": 1, "h": 2},
        {"id": "exit_f2_east", "x": 63, "y": 7, "w": 1, "h": 2},
        {"id": "exit_f2_south", "x": 44, "y": 35, "w": 2, "h": 1},
    ],
    "groups": {
        "g_f2_elite": (58, 9),
        "g_f2_a": (14, 19),
        "g_f2_b": (20, 12),
        "g_f2_c": (28, 11),
        "g_f2_d": (34, 23),
        "g_f2_e": (51, 16),
        "g_f2_f": (49, 4),
        "g_f2_g": (12, 5),
        "g_f2_h": (56, 20),
        "g_f2_i": (19, 30),
        "g_f2_j": (35, 16),
        "g_f2_sleep": (41, 25),
    },
    "chests": {"chest_f2_hidden": (59, 30), "chest_f2_vines": (31, 2), "chest_f2_boulder": (8, 32)},
    "gates": {"gate_f2_vines": (31, 7), "gate_f2_boulder": (9, 28)},
    "covers": {"cover_f2_a": (51, 25, 11, 8)},
    "springs": {"spring_f2": (9, 24)},
    "npcs": {"npc_f2_shrine": (19, 5)},
    "lore": {"lore_f2_pond": (33, 17)},
    "props": [("prop_adv_lm_f2", 13, 4)],
}
# Where the neighbours land in M2 (their exits' arriveX / arriveY must change to these, Lượt 2).
ARRIVALS = {"map_forest_edge/exit_f1_east": (1, 21), "map_forest_heart/exit_f3_west": (62, 7), "map_mountain_tunnels/exit_n5_west": (44, 34)}


def draft():
    maps = json.loads((REPO / "content" / "adventure" / "maps.json").read_text(encoding="utf8"))["maps"]
    old = next(m for m in maps if m["id"] == MAP_ID)
    m = json.loads(json.dumps(old))
    m["terrain"] = build()
    m["spawn"] = OBJECTS["spawn"]
    m["portal"] = OBJECTS["portal"]
    for e in m["exits"]:
        pos = next(p for p in OBJECTS["exits"] if p["id"] == e["id"])
        e.update({k: pos[k] for k in ("x", "y", "w", "h")})
    for kind in ("groups", "chests", "gates", "springs", "npcs", "lore"):
        for o in m[kind]:
            o["x"], o["y"] = OBJECTS[kind][o["id"]]
    for c in m["covers"]:
        c["x"], c["y"], c["w"], c["h"] = OBJECTS["covers"][c["id"]]
    for p, (prop, x, y) in zip(m["props"], OBJECTS["props"]):
        assert p["prop"] == prop
        p["x"], p["y"] = x, y
    # Same ids, counts and kinds as the live map.
    for kind in ("groups", "chests", "gates", "covers", "springs", "npcs", "lore", "exits", "props", "puzzles", "nodes"):
        assert [o.get("id", o.get("prop")) for o in m[kind]] == [o.get("id", o.get("prop")) for o in old[kind]], kind
    return m


def write(m):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "M2_layout_draft.json").write_text(json.dumps({"map": m, "arrivals": ARRIVALS}, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    lines = [f"# M2 {MAP_ID} — Rừng Sâu, layout v3 DRAFT (64 x 36), generated by scripts/art/map_v3/m2_layout.py", "", "grid:"]
    lines += m["terrain"]
    lines += ["", "objects (kind id x y):", f"  spawn {m['spawn']['x']} {m['spawn']['y']}", f"  portal {m['portal']['x']} {m['portal']['y']}"]
    for e in m["exits"]:
        lines.append(f"  exit {e['id']} {e['x']} {e['y']} {e['w']}x{e['h']} -> {e['to']} (arrive there {e['arriveX']},{e['arriveY']})")
    for kind in ("groups", "chests", "gates", "covers", "springs", "npcs", "lore"):
        for o in m[kind]:
            extra = f" {o['w']}x{o['h']}" if "w" in o else ""
            lines.append(f"  {kind[:-1] if kind != 'lore' else 'lore'} {o['id']} {o['x']} {o['y']}{extra}")
    for p in m["props"]:
        lines.append(f"  prop {p['prop']} {p['x']} {p['y']}")
    lines += ["", "neighbours land here (their arriveX/arriveY to update):"] + [f"  {k} -> {x},{y}" for k, (x, y) in ARRIVALS.items()]
    (OUT / "M2_layout_draft.txt").write_text("\n".join(lines) + "\n", encoding="utf8")


if __name__ == "__main__":
    write(draft())
    print((OUT / "M2_layout_draft.txt").read_text(encoding="utf8"))
