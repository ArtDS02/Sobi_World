# Cuts the reference crops for the scenery kit (decision 045) out of the accepted map paintings of batch adventure-14-map-v2,
# and packs them into one hint picture per kit group. Usage: python scripts/art/map_layouts_v2/refs.py   (from the repo root)
# Writes art_inbox/.hints/adventure-14-map-v2/ref/<zone>/<name>.png (single crops) and ref/<group>.png (the hints batch.py --kit uses).
# Boxes are pixels (x0, y0, x1, y1) on the paintings as the owner saved them (~1376 x 768). M7 and N7 are left out (style not accepted).
import sys
from pathlib import Path

from PIL import Image

ART = Path(__file__).resolve().parents[3] / "art_inbox"
SRC = ART / ".batch" / "adventure-14-map-v2"
OUT = ART / ".hints" / "adventure-14-map-v2" / "ref"
SCALE = 2  # paintings are 1 tile ~ 21 px; the hints show the crops twice as big
MAX_SIDE = 760
ROW_W = 1900
GAP = 24

# group -> [(name, map, box)]
GROUPS = {
    # --- forest ---
    "forest_surface": [
        ("grass_a", "M1", (170, 300, 300, 375)), ("grass_b", "M1", (950, 250, 1100, 330)), ("path", "M1", (330, 372, 600, 428)),
        ("path_v", "N1", (815, 400, 885, 560)), ("water", "M1", (630, 80, 705, 370)), ("pond", "N1", (722, 148, 852, 232)),
        ("top", "N1", (230, 455, 480, 595)),
    ],
    "forest_edge": [
        ("plateau", "M1", (770, 55, 1140, 240)), ("cliff_stairs", "N1", (55, 590, 500, 690)), ("cliff_band", "N2", (380, 240, 745, 300)),
        ("waterfall", "N2", (745, 235, 820, 300)), ("bank", "M1", (590, 280, 760, 380)),
    ],
    "forest_cover": [
        ("canopy_edge", "M1", (0, 600, 330, 768)), ("canopy_band", "M1", (300, 0, 620, 100)), ("mushroom_cover", "N1", (85, 105, 405, 300)),
        ("willow", "N3", (410, 320, 552, 445)), ("dark_grove", "M2", (285, 500, 510, 700)),
    ],
    "forest_props": [
        ("oak", "M1", (450, 450, 560, 555)), ("round_trees", "M1", (30, 500, 180, 620)), ("rocks", "M1", (595, 480, 640, 530)),
        ("boulder", "N2", (555, 290, 635, 355)), ("mossy_boulder", "M2", (1205, 60, 1290, 120)), ("stump", "N2", (925, 565, 975, 615)),
        ("vine_tree", "M2", (845, 85, 885, 215)), ("bridge_h", "M1", (628, 370, 738, 435)), ("bridge_wide", "N2", (708, 438, 812, 485)),
        ("mushroom", "N1", (965, 410, 1060, 500)), ("reeds_pond", "N3", (240, 160, 465, 320)), ("stone_fence", "N3", (595, 312, 760, 348)),
        ("lantern", "N1", (1020, 566, 1050, 600)), ("bushes", "N1", (550, 420, 740, 610)),
    ],
    "forest_landmark": [
        ("stilt_hut", "N3", (1025, 495, 1125, 610)), ("dolmen", "N2", (676, 60, 868, 190)), ("mushroom", "N1", (965, 410, 1060, 500)),
    ],
    "forest_exit": [
        ("waterfall_cave", "N2", (580, 510, 825, 685)), ("dolmen", "N2", (676, 60, 868, 190)), ("portal", "M1", (116, 278, 164, 324)),
        ("portal_post", "N1", (928, 663, 974, 724)),
    ],
    # --- mountain ---
    "mountain_surface": [
        ("ground_path", "M4", (560, 540, 830, 700)), ("path_ground", "M6", (250, 165, 560, 262)), ("lava", "M6", (650, 300, 820, 520)),
        ("lava_river", "M4", (250, 40, 640, 250)), ("top", "M5", (380, 200, 650, 300)),
    ],
    "mountain_edge": [
        ("cliff_stairs", "M4", (540, 455, 950, 535)), ("cliff_face", "M5", (360, 290, 700, 400)), ("terrace", "M6", (60, 255, 240, 345)),
        ("lava_bank", "M4", (830, 550, 1010, 650)), ("outer_cliff", "M5", (300, 0, 560, 110)),
    ],
    "mountain_cover": [
        ("overhang", "M4", (1090, 545, 1300, 640)), ("overhang_hidden", "M5", (800, 300, 968, 425)), ("crystal_cave", "N5", (1045, 60, 1310, 265)),
        ("dark_cave", "M6", (60, 570, 260, 710)), ("rock_band", "M4", (300, 690, 800, 768)),
    ],
    "mountain_props": [
        ("hut_cart", "M4", (70, 280, 170, 385)), ("boulder", "M4", (130, 430, 215, 505)), ("dead_tree", "M4", (140, 185, 195, 245)),
        ("pines", "M4", (195, 215, 255, 285)), ("crystals", "M5", (330, 305, 375, 350)), ("trough", "M5", (128, 168, 236, 196)),
        ("boulder_round", "M6", (350, 270, 400, 325)), ("rope_bridge_h", "M4", (228, 372, 308, 432)), ("rope_bridge_v", "M4", (482, 100, 538, 198)),
        ("bridge_diag", "N5", (295, 445, 400, 545)), ("bridge_lava", "M6", (568, 268, 634, 372)), ("ruin_wall", "N5", (860, 310, 985, 395)),
        ("tombstone", "M6", (570, 205, 606, 255)),
    ],
    "mountain_landmark": [
        ("headframe", "M5", (545, 340, 630, 480)), ("dragon_skull", "M6", (95, 30, 205, 145)), ("mine_mound", "M6", (845, 330, 1040, 525)),
    ],
    "mountain_exit": [
        ("tunnel", "M4", (440, 195, 565, 315)), ("tunnel_b", "M4", (695, 195, 845, 305)), ("tunnel_c", "M5", (88, 380, 172, 462)),
        ("stone_door", "N5", (795, 105, 905, 235)), ("iron_gate", "N5", (920, 135, 1010, 220)), ("boulder", "N5", (930, 670, 1005, 745)),
        ("dark_cave", "M6", (250, 65, 410, 180)), ("portal", "M5", (145, 245, 218, 302)),
    ],
    # --- ruins ---
    "ruins_surface": [
        ("floor", "M8", (100, 95, 295, 260)), ("path", "M9", (150, 85, 450, 140)), ("mossy", "M9", (255, 420, 460, 545)),
        ("corridor", "M8", (0, 330, 450, 440)), ("water", "N6", (330, 290, 770, 495)), ("void", "M8", (335, 455, 415, 505)),
    ],
    "ruins_edge": [
        ("pit_edge", "M9", (455, 135, 1165, 205)), ("pit_side", "M9", (1105, 195, 1170, 625)), ("island_cliff", "N6", (900, 680, 1110, 768)),
        ("wall_top", "M8", (20, 0, 420, 70)), ("pool_stairs", "M9", (160, 135, 320, 255)), ("carved_pool", "M8", (785, 510, 995, 695)),
    ],
    "ruins_cover": [
        ("temple_roof", "N6", (790, 15, 1045, 232)), ("hidden_room", "M8", (65, 450, 325, 730)), ("fallen_beams", "M9", (510, 425, 690, 570)),
        ("dead_roots", "M9", (60, 55, 255, 175)),
    ],
    "ruins_props": [
        ("pillars", "M8", (120, 240, 190, 305)), ("broken_column", "M9", (700, 265, 855, 395)), ("rubble", "M8", (325, 35, 405, 85)),
        ("rubble_pile", "M8", (0, 225, 65, 295)), ("fence", "M9", (78, 300, 182, 338)),
        ("tent_fire", "M8", (1120, 510, 1205, 600)), ("grave", "M9", (110, 240, 145, 285)), ("urns", "N6", (150, 335, 185, 372)),
        ("stone_bridge", "N6", (765, 475, 815, 565)), ("wall_rubble", "N6", (945, 240, 1065, 305)), ("mushroom", "M9", (105, 445, 150, 490)),
    ],
    "ruins_landmark": [
        ("statue_broken", "M9", (700, 265, 855, 395)), ("crypt_hall", "N6", (1080, 10, 1360, 260)), ("crypt_tomb", "N6", (35, 505, 370, 768)),
    ],
    "ruins_exit": [
        ("wall_gate", "M9", (835, 0, 950, 60)), ("wall_door", "M9", (1220, 210, 1260, 260)), ("portal", "M8", (45, 310, 105, 370)),
        ("pedestal", "M9", (1215, 565, 1265, 635)), ("hidden_stairs", "M8", (240, 455, 305, 545)),
    ],
    # --- coast ---
    "coast_surface": [
        ("sand", "N9", (820, 70, 1090, 190)), ("shore", "N9", (0, 530, 300, 640)), ("sea_deep", "N9", (450, 600, 800, 768)),
        ("lagoon", "N8", (300, 300, 700, 470)), ("dune_top", "N9", (100, 45, 540, 230)), ("wet_sand", "N9", (1180, 560, 1376, 720)),
    ],
    "coast_edge": [
        ("dune_cliff", "N9", (85, 190, 545, 285)), ("islet_stairs", "N8", (745, 180, 960, 268)), ("islet", "N8", (30, 170, 215, 305)),
        ("shore_curve", "N9", (0, 560, 200, 640)),
    ],
    "coast_cover": [
        ("palm_canopy", "N9", (540, 65, 775, 285)), ("jungle", "N9", (1095, 80, 1376, 260)), ("sea_cave", "N8", (1055, 50, 1300, 255)),
        ("sea_cave_b", "N9", (40, 312, 220, 452)), ("palm_island", "N8", (225, 5, 400, 135)),
    ],
    "coast_props": [
        ("dock_v", "N9", (250, 440, 350, 625)), ("dock", "N9", (815, 378, 930, 470)), ("dock_end", "N9", (1050, 488, 1190, 565)),
        ("dock_diag", "N8", (272, 262, 410, 350)), ("rocks", "N9", (225, 675, 295, 730)), ("coral_reef", "N8", (925, 415, 1105, 555)),
        ("crab", "N9", (450, 280, 500, 322)), ("clam", "N8", (1265, 525, 1335, 585)), ("palm_islet", "N8", (150, 555, 270, 670)),
        ("jellyfish", "N9", (400, 500, 445, 550)), ("lilypads", "N8", (215, 200, 295, 250)),
    ],
    "coast_landmark": [
        ("shipwreck", "N9", (910, 345, 1130, 495)), ("turtle_arch", "N8", (755, 575, 895, 685)), ("coral_reef", "N8", (925, 415, 1105, 555)),
    ],
    "coast_exit": [
        ("sea_cave", "N8", (1055, 50, 1300, 255)), ("sea_cave_b", "N9", (40, 312, 220, 452)), ("portal", "N8", (400, 130, 465, 195)),
        ("turtle_arch", "N8", (755, 575, 895, 685)),
    ],
    # --- shared ---
    "chests": [
        ("wood", "M1", (1070, 98, 1106, 132)), ("wood_b", "M1", (1232, 545, 1272, 582)), ("silver", "M4", (320, 325, 362, 360)),
        ("gold", "M6", (1225, 180, 1275, 228)), ("gold_b", "N9", (980, 525, 1025, 565)), ("hidden", "N1", (275, 328, 307, 358)),
        ("hidden_b", "M6", (315, 125, 350, 162)), ("corrupt", "N6", (1100, 445, 1155, 500)), ("pair", "N8", (765, 185, 912, 238)),
    ],
    "springs": [
        ("forest", "M1", (333, 312, 377, 345)), ("mountain", "M6", (965, 650, 1012, 685)), ("mountain_b", "M5", (1068, 205, 1118, 235)),
        ("coast", "N9", (760, 330, 808, 368)), ("ruins", "N6", (898, 432, 937, 462)), ("ruins_b", "M8", (1113, 613, 1152, 647)),
    ],
    "puzzle": [
        ("pedestal", "M9", (1215, 565, 1265, 635)), ("stone_gate", "M5", (380, 98, 428, 152)),
        ("signstone", "N2", (1225, 330, 1258, 368)), ("tombstone", "M6", (570, 205, 606, 255)), ("lanterns", "N1", (1020, 566, 1050, 600)),
        ("portal", "M1", (116, 278, 164, 324)),
    ],
    "corrupt": [
        ("forest_patch", "N1", (920, 410, 1200, 555)), ("mountain_crack", "M5", (1000, 460, 1125, 560)), ("coast_sludge", "N9", (425, 390, 605, 520)),
        ("ruins_floor", "M8", (430, 90, 645, 295)), ("crystal", "M1", (985, 440, 1075, 512)), ("roots_crystal", "M9", (285, 215, 405, 315)),
        ("crystal_big", "M8", (1295, 690, 1376, 768)),
    ],
    "forest_corrupt": [
        ("patch", "N1", (920, 410, 1200, 555)), ("grove", "M2", (90, 515, 295, 690)), ("marsh", "N3", (65, 270, 265, 410)),
        ("crack", "N2", (230, 530, 315, 605)), ("dead_trees", "M2", (100, 60, 320, 200)),
    ],
    "mountain_coast_corrupt": [
        ("crack", "M5", (1000, 460, 1125, 560)), ("ground", "M4", (320, 340, 485, 465)), ("vein", "N5", (405, 135, 545, 245)),
        ("sludge", "N9", (425, 390, 605, 520)), ("sand", "N8", (380, 515, 645, 640)), ("jungle", "N9", (1130, 160, 1290, 260)),
    ],
    "ruins_corrupt": [
        ("floor", "M8", (430, 90, 645, 295)), ("roots", "M9", (285, 215, 405, 315)), ("tomb", "N6", (1150, 85, 1290, 200)),
        ("patch", "M9", (905, 450, 1055, 545)), ("crystal", "M8", (1295, 690, 1376, 768)),
    ],
}


def crop(code: str, box) -> Image.Image:
    im = Image.open(SRC / f"{code}.png").convert("RGB")
    x0, y0, x1, y1 = box
    c = im.crop((max(0, x0), max(0, y0), min(im.width, x1), min(im.height, y1)))
    k = min(SCALE, MAX_SIDE / max(c.size))
    return c.resize((round(c.width * k), round(c.height * k)), Image.LANCZOS)


def pack(tiles: list[Image.Image]) -> Image.Image:
    """Shelf-pack the crops left to right on a white sheet, GAP pixels apart."""
    rows, row, w = [], [], GAP
    for t in tiles:
        if row and w + t.width + GAP > ROW_W:
            rows.append(row)
            row, w = [], GAP
        row.append(t)
        w += t.width + GAP
    rows.append(row)
    width = max(GAP + sum(t.width + GAP for t in r) for r in rows)
    height = GAP + sum(max(t.height for t in r) + GAP for r in rows)
    sheet = Image.new("RGB", (width, height), "white")
    y = GAP
    for r in rows:
        x = GAP
        for t in r:
            sheet.paste(t, (x, y))
            x += t.width + GAP
        y += max(t.height for t in r) + GAP
    return sheet


def main() -> int:
    missing = sorted({code for items in GROUPS.values() for _, code, _ in items if not (SRC / f"{code}.png").is_file()})
    if missing:
        print("missing paintings:", ", ".join(missing))
        return 1
    for group, items in GROUPS.items():
        zone = group.split("_")[0] if group.split("_")[0] in ("forest", "mountain", "ruins", "coast") else "shared"
        tiles = []
        for name, code, box in items:
            t = crop(code, box)
            (OUT / zone).mkdir(parents=True, exist_ok=True)
            t.save(OUT / zone / f"{group.removeprefix(zone + '_')}_{name}.png")
            tiles.append(t)
        pack(tiles).save(OUT / f"{group}.png")
    print(len(GROUPS), "hint pictures,", sum(len(v) for v in GROUPS.values()), "crops ->", OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
