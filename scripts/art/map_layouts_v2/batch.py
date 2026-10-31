# Writes art_inbox/.batch/adventure-14-map-v2/batch.json (decision 045): the map repaint sheets from the v2 layouts (render.py first),
# and with --kit the scenery kit sheets (hints from refs.py). Usage: python scripts/art/map_layouts_v2/batch.py [--kit [--redo M7,N7]], then
# `python .claude/skills/image-to-prompt/scripts/art.py prep adventure-14-map-v2`.
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3] / "art_inbox"
B = "adventure-14-map-v2"
H = f".hints/{B}"

STYLE_LINE = (
    "Image {n} is the STYLE REFERENCE: a close-up of a finished map from my game, at the exact scale I want. Copy its art style and its scale exactly: a cozy top-down RPG map seen from "
    "above with a slight 3/4 tilt, smoothly painted, crisp and finely detailed digital illustration with soft gradients (NOT pixel art); thin dark outlines; fresh bright "
    "greens, sky-blue water and warm sandy paths; lots of tiny details everywhere (separate grass tufts, tiny white, yellow and pink "
    "flowers, pebbles, lily pads, worn path edges with small stones); round fluffy trees made of clustered, highlighted leaf clumps on "
    "short brown trunks; small soft shadows. Do NOT copy the layout or objects of image {n}."
)
NEGATIVE_LINE = (
    "No text, letters, numbers, labels, captions, watermark, logo, border or frame. Not pixel art (no square pixels, no "
    "stair-stepped outlines, no dithering). Not a 3D render, not flat vector, not a "
    "thick-outlined cartoon or comic style, no big plain blobs or plain coloured circles, no blurry or smudgy painting. No glow, no "
    "sparkles, no floating particles."
)
SHAPE_LINE = (
    "Image {n} is only a rough guide to {subject}: keep its layout and shapes, but repaint everything cleanly in the style of image 1; "
    "do not copy its rough look, flat colours or outlines."
)
ACCEPTED_LINE = (
    "Image {n} is the accepted look of {subject}: match its shape, colours and shading closely, in the style of image 1, but leave out "
    "any text or letters."
)
TILE_FRAMING = (
    "Each cell is ONE perfectly square texture tile seen from straight above, flat and evenly lit, filling the whole square with no "
    "border. Nothing stands out in the middle; the texture is spread evenly so that copies of the same tile placed side by side join "
    "seamlessly with no visible seam. All squares are exactly the same size."
)
EDGE_FRAMING = (
    "Each piece is part of the raised ground of a top-down RPG map, seen in the same slight 3/4 view as image 1: you see the front "
    "face of the cliff or wall, with a thin strip of the top surface along its upper edge. The straight pieces are wide horizontal "
    "bands whose left and right ends are cut straight so copies join side by side; the end pieces finish the band with a rounded "
    "corner on one side only. No ground under the pieces."
)
COVER_FRAMING = (
    "Each piece is an overhead cover drawn above the hero on a top-down RPG map (seen from above with the slight 3/4 tilt of image 1): "
    "it hides what is under it. Solid and opaque, with a soft dark-brown outline; no ground, no trunks or walls below it, no shadow."
)
PROP_FRAMING = (
    "Three-quarter view from slightly above, exactly like the objects on the map of image 1. Each object stands on its own with no "
    "ground patch; only a very small soft contact shadow directly under it."
)
BIG_FRAMING = (
    "Three-quarter view from slightly above, exactly like the objects on the map of image 1. Each is a big landmark about four map "
    "squares wide, standing on its own with no ground patch; only a small soft contact shadow under it."
)
ICON_FRAMING = (
    "Each is a small round badge icon, front-on, centred, filling most of its cell, readable at 32 px; simple bold shape, no letters."
)

ZONES = {
    "F": dict(name="forest", vi="Rừng Thì Thầm", theme="a cozy sunny fairy-tale forest", creature="forest"),
    "M": dict(name="mountain", vi="Núi Đá Vọng", theme="a rocky mountain with an abandoned mine and lava", creature="mountain"),
    "C": dict(name="coast", vi="Bờ Biển", theme="a sunny tropical coast with sand, coral and a calm sea", creature="sea"),
    "R": dict(name="ruins", vi="Tàn Tích Cổ", theme="ancient overgrown stone ruins with runes", creature="ruin"),
}

MAP_STYLE_LINE = (
    "Image {n} is the STYLE TARGET: a whole map from my game already painted the way I want. Copy its art style exactly: a cozy "
    "top-down RPG map seen from above with a slight 3/4 tilt, smoothly painted, crisp and finely detailed digital illustration with soft gradients (NOT pixel art); thin "
    "dark outlines; fresh bright greens, sky-blue water and warm sandy paths; lots of tiny details (grass tufts, tiny flowers, pebbles, "
    "lily pads, worn path edges with small stones); round fluffy trees of clustered, highlighted leaf clumps on short brown trunks; "
    "soft contact shadows. Do NOT copy the content or layout of image {n}, only its style."
)
MAP_RULES = (
    "Image 2 is the CURRENT MAP: a top-down exploration area of my game built from flat placeholder tiles on a hidden grid of {w} "
    "columns x {h} rows. Redraw image 2 as a beautiful, finished, hand-painted game map in exactly the style of image 1{zone_note}. "
    "KEEP THE LAYOUT OF IMAGE 2 EXACTLY, this is the most important rule; the result must line up with image 2 when laid on top of it: "
    "same framing, the whole map edge to edge, landscape, same proportions as image 2, no zoom, no crop, no border; every pale path "
    "stays in the same place with the same width and turns (round off the blocky stair-step corners into smooth curves); every dark "
    "mass of image 2 is {mass}, impassable: keep each one in place, never open a gap in it and never add one across a path or open "
    "ground; {water}; every brown frame is a raised {plateau} with a cliff face, keep it in place and draw its front edge (the lower side) "
    "as a cliff face seen in 3/4 view; the striped squares in the cliff are steps; the squares crossing the {water_word} are {bridge}; the "
    "light-violet patches are corrupted ground ({corrupt_ground}); open ground stays open with only small details. "
    "The area inside each white dashed frame is a HIDDEN place under an overhead cover: paint the cover over it ({covers}) so that what "
    "is under it is only hinted, and leave out the dashed frame. "
    "The sprites of image 2 (creatures, chests, stones, shrines, the pig) are stand-ins: keep each one at the same spot and about the "
    "same size, but repaint them in the style of image 1. Creatures are cute but menacing {creatures}, each with visible corruption "
    "marks (dark-violet patches on the body, small violet crystal spikes, violet eyes); bigger ones show more corruption."
)
ZONE_WORDS = {
    "zone_forest": dict(zone_note="", mass="dense forest", water="the water keeps its exact shape and place, with grassy, rocky banks",
                        plateau="grassy plateau", water_word="water", bridge="wooden bridges",
                        corrupt_ground="grey wilted grass with thin dark-violet cracks", creatures="forest monsters"),
    "zone_mountain": dict(zone_note=" (image 1 is a forest: keep its way of painting, but this map is a rocky mountain, so use warm brown rock, "
                          "dusty soil, pale gravel paths, sparse pines and dry grass instead of lush green)",
                          mass="solid mountain rock and cliffs with a few pines on top",
                          water="the orange areas are thick LAVA: keep their exact shape and place, with dark crusted rock banks; inside the rock "
                          "masses the open areas are cave chambers and tunnels with timber frames", plateau="rocky terrace", water_word="lava",
                          bridge="stone or rope bridges", corrupt_ground="cracked rock with thin dark-violet veins",
                          creatures="mountain monsters (beetles, lizards, goats, hawks, rock golems)"),
    "zone_ruins": dict(zone_note=" (image 1 is a forest: keep its way of painting, but this map is ancient stone ruins, so use worn grey-beige "
                       "flagstones, mossy grass between the stones, broken pillars, crumbling walls and dead trees)",
                       mass="crumbling ancient stone walls and rubble", water="the blue areas are dark still pools and channels: keep their "
                       "exact shape and place, with carved stone edges", plateau="stone dais", water_word="water", bridge="carved stone bridges",
                       corrupt_ground="cracked flagstones with black roots and dark-violet veins",
                       creatures="ruin monsters (stone sentinels, rune spirits, shadow priests, living idols)"),
    "zone_coast": dict(zone_note=" (image 1 is a forest: keep its way of painting, but this map is a sunny tropical coast, so use warm golden "
                       "sand, sun-bleached boardwalks, palm groves, shells, coral and a turquoise sea)",
                       mass="dense palm jungle and sea rocks", water="the turquoise areas are the SEA and lagoons: keep their exact shape and "
                       "place, with white foam along the sand", plateau="grassy dune", water_word="sea", bridge="wooden boardwalks and docks",
                       corrupt_ground="grey sand with oily dark pools and dark-violet cracks",
                       creatures="sea monsters (crabs, jellyfish, frogs, gulls, drowned spirits)"),
}
MAP_FRAMING = "The whole map, edge to edge, as a full-bleed landscape picture with the same proportions as image 2. No UI, no text, no labels."


def corruption_words(pct: int) -> str:
    if pct <= 12:
        return "almost untouched, sunny and lush"
    if pct <= 20:
        return "mostly healthy, a little dimmer, a few withered plants and violet cracks"
    if pct <= 35:
        return "noticeably sick: withered plants, violet cracks and crystals here and there, slightly dimmer light"
    if pct <= 50:
        return "badly sick: many dead plants, dark-violet crystal clusters, smoky or hazy dim light"
    if pct <= 70:
        return "heavily corrupted: dark-violet crystals and black roots everywhere, gloomy dusk light, only a few healthy patches"
    return "almost consumed by corruption: black roots and big dark-violet crystals split the ground, dark heavy sky, very few healthy patches"


LAYOUTS = json.loads((ROOT / H / "before" / "layouts.json").read_text(encoding="utf-8"))

sheets = []
for code, m in LAYOUTS.items():
    covers = "; ".join(c["what"] for c in m["covers"]) or "none"
    items = "; ".join(f"{o['what']}: {o['x']}% from the left, {o['y']}% from the top" for o in m["objects"])
    sheets.append(dict(
        id=code, title=f"Vẽ lại map {code} {m['name']} ({m['w']} × {m['h']} ô)", mode="single", kind="bg", style="mapfull",
        refs=[dict(type="shape", src=f"{H}/before/{m['file']}", subject="the exact layout of the map")],
        object=(MAP_RULES.format(w=m["w"], h=m["h"], covers=covers, **ZONE_WORDS[m["zone"]]) + f" Theme of this map ({m['name']}): {m['theme']}. "
                f"Corruption about {m['corruption']} %: {corruption_words(m['corruption'])}. Keep these at these spots: {items}."),
        framing=MAP_FRAMING, assets=[f"adv_map_paint_{code.lower()}_{m['key'].removeprefix('map_')}"], prompt=dict(style_line=MAP_STYLE_LINE)))

KIT = "--kit" in sys.argv  # the scenery kit comes after the map paintings; its hints are cut from the accepted paintings (refs.py)
map_sheets = sheets  # with --kit only the maps named by --redo stay in the batch
EDGE = dict(type="shape", src=f"{H}/EDGE_shape.png",
            subject="how a raised plateau is built on my map: a flat top, a front cliff face band below it, stone steps cut into the face, and a finished end at each side")
# The crops are cut from my small map paintings (about 21 px per square), so they are soft; the accepted line asks for a crisp redraw.
KIT_ACCEPTED_LINE = (
    "Image {n} shows {subject}. The pieces are cut from my finished maps, which are small pictures, so they look soft: keep their "
    "shapes, materials, colours and shading, but redraw them crisp and finely detailed in the style of image 1, much sharper than "
    "image {n}. Leave out any creatures, chests, text or letters you see in image {n}."
)


def ref(group: str, subject: str) -> dict:
    """An accepted-look hint cut from the map paintings by refs.py."""
    return dict(type="accepted", src=f"{H}/ref/{group}.png", subject=subject)

KITS = {
    "F": dict(
        T=["grass A: soft bright-green meadow grass with a few short darker tufts", "grass B: meadow grass with clover and a few tiny white and yellow flowers",
           "grass C: darker mossy grass of the forest shade", "path A: light sandy-brown packed dirt", "path B: dirt with small pebbles and faint cart ruts",
           "raised meadow top: short lighter grass", "stream water: clear bright-blue shallow water with soft pale ripples", "deep water: deeper blue water with darker ripples"],
        Tn=["grass_a", "grass_b", "grass_c", "path_a", "path_b", "top", "water", "water_deep"],
        E=["a long straight earthy cliff face with roots, small stones and a grassy lip along the top", "the left end of that cliff face, rounded",
           "the right end of that cliff face, rounded", "stone steps cut into the earthy cliff face, about two squares wide",
           "a long straight stream bank: grassy edge with reeds and white foam along the water line", "a small waterfall pouring down the earthy cliff face into foam"],
        En=["cliff", "cliff_end_l", "cliff_end_r", "stairs", "bank", "waterfall"],
        O=["a big cluster of three round oak treetops seen from above, covering about 4 x 3 squares", "a medium cluster of two round oak treetops",
           "a long straight band of dense treetops, left and right ends cut straight", "a cluster of pink-blossom treetops seen from above",
           "a drooping willow curtain of long leafy strands", "the mossy top of a huge fallen hollow log, seen from above"],
        On=["canopy_big", "canopy_mid", "canopy_band", "canopy_blossom", "willow", "log_top"],
        P=["a round leafy oak tree", "a pink-blossom tree", "a tall fir tree", "a cluster of round bushes with red berries",
           "a pile of mossy rocks", "a fallen log with little orange mushrooms", "a short horizontal wooden fence section", "a wooden lantern post with a blank signpost"],
        Pn=["tree_oak", "tree_blossom", "tree_fir", "bushes", "rocks", "log", "fence", "lantern"],
        Q=["a horizontal wooden bridge crossing a stream two squares wide", "a vertical wooden bridge (planks running across)", "a cluster of two old tree stumps",
           "a cluster of wild flowers in several colours", "a cluster of tall reeds and cattails", "a cluster of lily pads with one white water lily",
           "a ring of small red-and-white mushrooms", "a stacked pile of firewood"],
        Qn=["bridge_h", "bridge_v", "stumps", "flowers", "reeds", "lilypads", "mushroom_ring", "woodpile"],
        L=["a giant hollow ancient oak with a door-like hollow in its trunk and huge roots", "an old wooden water mill with a big wheel, standing at a stream",
           "a ring of mossy standing stones around a small stone shrine"],
        Ln=["oak_giant", "watermill", "stone_ring"],
        X=["a cave mouth in an earthy cliff face, dark inside", "a rustic wooden archway over a trail", "a wall of thick tangled vines blocking a passage",
           "the same passage after the vines were burnt away: charred vine ends at the sides, open dark gap", "a thorny bramble bush blocking a path",
           "the same bramble burnt to a small heap of ash", "the entrance of a huge hollow log tunnel", "a wooden signpost with three blank arrow boards"],
        Xn=["cave", "arch", "vinewall", "vinewall_open", "bramble", "bramble_ash", "log_tunnel", "signpost"],
    ),
    "M": dict(
        T=["rocky soil A: warm sandy-brown soil with tiny pebbles", "rocky soil B: soil with small dry grass tufts", "loose grey scree gravel",
           "path: pale cream packed gravel with small grey stones", "mine floor: weathered wooden planks", "plateau top: flat grey-brown rock with thin cracks",
           "lava: thick orange lava with darker crusted swirls, painted softly, not glowing", "cooled lava: dark basalt crust with thin orange cracks"],
        Tn=["ground_a", "ground_b", "scree", "path", "planks", "top", "lava", "lava_crust"],
        E=["a long straight layered rock cliff face in grey-brown strata", "the left end of that rock cliff face, rounded", "the right end of that rock cliff face, rounded",
           "rough stone steps cut into the rock cliff face, about two squares wide", "a long straight lava bank: dark crusted rock edge with an orange line of lava",
           "a long straight mine wall: rock face held by wooden timber frames"],
        En=["cliff", "cliff_end_l", "cliff_end_r", "stairs", "lava_bank", "mine_wall"],
        O=["a big rock overhang seen from above, covering about 4 x 3 squares", "a medium rock overhang", "a long straight band of rock overhang, ends cut straight",
           "a mine roof of wooden planks and beams seen from above", "a cluster of snowy pine treetops seen from above", "a cave ceiling chunk with hanging roots and small stalactites"],
        On=["overhang_big", "overhang_mid", "overhang_band", "mine_roof", "pines_top", "cave_ceiling"],
        P=["a mountain pine tree", "a dead tree stump", "a cluster of boulders", "a rock with copper ore veins", "a wooden mine cart on a short piece of rail",
           "a straight piece of mine-cart rail track", "a wooden scaffold platform", "a mining lantern on a wooden post"],
        Pn=["pine", "stump", "boulders", "ore_rock", "mine_cart", "rail", "scaffold", "lantern"],
        Q=["a stack of wooden crates", "a barrel with a pickaxe leaning on it", "a horizontal stone bridge over lava", "a vertical rope bridge with wooden planks",
           "a steam vent in the rock with a soft white puff", "an amber crystal ore node", "a cluster of dry mountain grass", "a curved piece of mine-cart rail track"],
        Qn=["crates", "barrel", "bridge_h", "bridge_v", "steam_vent", "amber_node", "dry_grass", "rail_curve"],
        L=["an abandoned wooden mine headframe tower with a big pulley wheel", "a giant ancient dragon skull half sunk into the rock",
           "a collapsed giant forge with a stone chimney and a huge anvil"],
        Ln=["headframe", "dragon_skull", "forge"],
        X=["a mine tunnel entrance with a wooden timber frame, dark inside", "a cave mouth in a rock cliff face", "a cracked rock wall that looks breakable",
           "the same rock wall smashed open: rubble at the sides, open dark gap", "a rope ladder hanging down a rock cliff face", "a rough stone archway gate",
           "a big round boulder blocking a path", "the same boulder broken into a few pieces"],
        Xn=["tunnel", "cave", "crackwall", "crackwall_open", "ladder", "arch", "boulder", "boulder_broken"],
    ),
    "C": dict(
        T=["warm sand A: soft golden beach sand", "sand B: sand with tiny shells and pebbles", "wet darker sand near the sea", "grassy dune top: sand with sparse beach grass",
           "boardwalk: sun-bleached wooden planks", "rocky tidal flat: flat wet stones", "shallow sea: clear turquoise water with soft ripples", "deep sea: deep blue water with darker ripples"],
        Tn=["sand_a", "sand_b", "sand_wet", "dune", "boardwalk", "tideflat", "sea", "sea_deep"],
        E=["a long straight sandstone sea cliff face in warm layers with a grassy lip on top", "the left end of that sandstone cliff, rounded", "the right end of that sandstone cliff, rounded",
           "sandstone steps cut into the cliff, about two squares wide", "a long straight shoreline: little white waves and foam rolling onto sand", "a long straight rocky shore with barnacles and foam"],
        En=["cliff", "cliff_end_l", "cliff_end_r", "stairs", "shore", "rock_shore"],
        O=["a big cluster of palm crowns seen from above, covering about 4 x 3 squares", "one big palm crown seen from above", "a long straight band of palm crowns, ends cut straight",
           "the rock ceiling of a sea cave arch seen from above", "a fishing net and sailcloth awning stretched on poles, seen from above", "a curtain of hanging kelp and seaweed"],
        On=["palms_big", "palm_one", "palms_band", "seacave_ceiling", "awning", "kelp_curtain"],
        P=["a leaning palm tree with coconuts", "a round beach bush", "a big driftwood log", "a rock covered with barnacles", "a small tide pool with a starfish",
           "a small wooden rowboat lying on the sand", "a little fishing hut on stilts", "a rope-wrapped lantern post"],
        Pn=["palm", "bush", "driftwood", "barnacle_rock", "tide_pool", "rowboat", "hut", "lantern"],
        Q=["a straight vertical wooden dock section", "the end of a dock with mooring posts", "crates, barrels and a fishing net", "a cluster of pink coral",
           "a cluster of green seaweed", "scattered shells and starfish", "a red-and-white buoy", "a rusty anchor half buried in sand"],
        Qn=["dock", "dock_end", "cargo", "coral", "seaweed", "shells", "buoy", "anchor"],
        L=["an old wooden shipwreck lying on its side on the sand", "an old striped lighthouse on rocks", "a giant stone arch shaped like a sea turtle shell"],
        Ln=["shipwreck", "lighthouse", "turtle_arch"],
        X=["a sea cave mouth in a sandstone cliff, dark inside", "a wooden dock archway hung with ropes", "a wall of hard coral blocking a passage",
           "the same coral wall broken open: coral pieces at the sides, open gap", "a giant clam, closed", "the same giant clam opened wide, empty",
           "a line of flat stepping stones across shallow water", "a rope ladder down a sea cliff"],
        Xn=["seacave", "dock_arch", "coralwall", "coralwall_open", "clam", "clam_open", "stepping_stones", "ladder"],
    ),
    "R": dict(
        T=["cracked flagstone floor A: worn grey-beige stone slabs", "flagstone B: slabs with moss and small weeds in the cracks", "a broken mosaic floor in faded colours",
           "ruin path: large pale stone slabs in a row", "dais top: smooth carved stone with a thin rune border pattern (no letters)", "dark rubble ground with small stone chips",
           "dark still water with a faint reflection", "overgrown ground: grass growing between broken stones"],
        Tn=["floor_a", "floor_b", "mosaic", "path", "dais", "rubble", "water", "overgrown"],
        E=["a long straight ancient wall face of big carved stone bricks with faint rune carvings", "the left end of that ruin wall, crumbled and rounded",
           "the right end of that ruin wall, crumbled and rounded", "grand worn stone steps, about two squares wide", "a long straight stone water-channel edge",
           "a long straight broken ruin wall with holes and fallen bricks"],
        En=["wall", "wall_end_l", "wall_end_r", "stairs", "channel_edge", "wall_broken"],
        O=["a broken roof of stone slabs and old beams seen from above, covering about 4 x 3 squares", "a collapsed vaulted arch seen from above", "a long straight band of roof slabs, ends cut straight",
           "a curtain of hanging black roots", "the dark crown of a giant dead tree seen from above", "thick vines grown over an archway, seen from above"],
        On=["roof_big", "vault", "roof_band", "roots_curtain", "deadtree_top", "vines_top"],
        P=["a tall rune pillar, intact", "a broken pillar", "a fallen column segment", "a rubble pile", "a stone brazier, unlit",
           "a small weathered stone lantern", "a torn plain cloth banner on a pole", "an overgrown stone bench"],
        Pn=["pillar", "pillar_broken", "column_fallen", "rubble", "brazier", "stone_lantern", "banner", "bench"],
        Q=["a rune floor plate (blank carved circle)", "a horizontal stone bridge over a channel", "a vertical stone bridge", "a cluster of broken clay urns",
           "a cluster of black twisted roots", "an old stone lectern with a closed book", "a section of rusty iron fence", "a cluster of ivy on fallen stones"],
        Qn=["rune_plate", "bridge_h", "bridge_v", "urns", "black_roots", "lectern", "iron_fence", "ivy_stones"],
        L=["a huge broken statue of a beast, headless and cracked, on a pedestal", "a sealed great stone door with heavy chains", "a giant ancient tree grown through a small temple"],
        Ln=["statue_broken", "sealed_door", "temple_tree"],
        X=["a grand stone gate arch, closed by a stone slab", "the same grand gate open, dark passage inside", "a rune-carved wall that looks crumbling",
           "the same rune wall crumbled open: rubble at the sides, open gap", "a collapsed stairway going down into darkness", "a small crypt entrance",
           "a stone pedestal with a dull clear crystal on top", "the same pedestal with the crystal shining warm white-gold"],
        Xn=["gate", "gate_open", "runewall", "runewall_open", "stairs_down", "crypt", "light_pedestal", "light_pedestal_lit"],
    ),
}


def sheet(sid, title, grid, rows, names, framing, refs, extra=None, kind="item"):
    if len(rows) == 1 and grid[0] > 1:
        rows = [rows[0][i:i + grid[1]] for i in range(0, len(rows[0]), grid[1])]
    s = dict(id=sid, title=title, mode="sheet", kind=kind, style="map", grid=grid, refs=refs, rows=rows, framing=framing, assets=names)
    if extra:
        s["extra"] = extra
    return s


def split(cells, cols):
    return [cells[i:i + cols] for i in range(0, len(cells), cols)]


LIQUID = {"F": "stream water", "M": "lava", "C": "sea", "R": "dark still water"}
kit_sheets = {}
for z, k in (KITS.items() if KIT else []):
    zd = ZONES[z]
    n = zd["name"]
    pre = f"adv_map_{n}_"
    theme = [f"Theme: {zd['theme']}. Not corrupted (corrupted versions are drawn separately)."]
    mine = f"my {n} maps"
    kit_sheets[z] = [
        sheet(f"{z}T", f"{zd['vi']}: 8 ô nền", [2, 4], split(k["T"], 4), [pre + "tile_" + x for x in k["Tn"]], TILE_FRAMING,
              [ref(f"{n}_surface", f"how the ground, paths and {LIQUID[z]} of {mine} are painted (copy the way of painting and the colours)")], theme),
        sheet(f"{z}E", f"{zd['vi']}: vách / bậc / bờ", [2, 3], split(k["E"], 3), [pre + "edge_" + x for x in k["En"]], EDGE_FRAMING,
              [EDGE, ref(f"{n}_edge", f"the cliff faces, steps and banks of {mine}")], theme),
        sheet(f"{z}O", f"{zd['vi']}: lớp che phía trên", [2, 3], split(k["O"], 3), [pre + "cover_" + x for x in k["On"]], COVER_FRAMING,
              [ref(f"{n}_cover", f"the overhead covers (treetops, rock overhangs, roofs, cave ceilings) that hide secret places on {mine}")], theme),
        sheet(f"{z}P", f"{zd['vi']}: đạo cụ 1", [2, 4], split(k["P"], 4), [pre + "prop_" + x for x in k["Pn"]], PROP_FRAMING,
              [ref(f"{n}_props", f"the trees, rocks, bridges and other objects of {mine} (copy the way of drawing and the materials, not the exact objects)")], theme),
        sheet(f"{z}Q", f"{zd['vi']}: đạo cụ 2", [2, 4], split(k["Q"], 4), [pre + "prop_" + x for x in k["Qn"]], PROP_FRAMING,
              [ref(f"{n}_props", f"the trees, rocks, bridges and other objects of {mine} (copy the way of drawing and the materials, not the exact objects)")], theme),
        sheet(f"{z}L", f"{zd['vi']}: 3 vật mốc lớn", [1, 3], [k["L"]], [pre + "landmark_" + x for x in k["Ln"]], BIG_FRAMING,
              [ref(f"{n}_landmark", f"the big landmarks already on {mine} (copy the way of drawing; draw the landmarks listed below)")], theme),
        sheet(f"{z}X", f"{zd['vi']}: lối ra, tường giả, câu đố", [2, 4], split(k["X"], 4), [pre + "exit_" + x for x in k["Xn"]], PROP_FRAMING,
              [ref(f"{n}_exit", f"the cave mouths, doors, gates and portals of {mine}")], theme),
    ]
CHESTS = ref("chests", "the treasure chests of my maps (wood, silver, gold, crystal)")
PUZZLE = ref("puzzle", "the pedestals, stone gates, signstones, lanterns and portals of my maps (copy the way of drawing, not the objects)")
CORRUPT = ref("corrupt", "how corruption already looks on my maps (violet cracks, dark sludge, crystals, black roots)")

CORR = "Corruption look of this game: dark-violet crystals with a pale lilac highlight, thin dark-violet veins, grey withered colours, black thorny roots; painted, never glowing."
shared = [
    sheet("H1", "Rương 4 loại: đóng / mở", [2, 4],
          [["a closed wooden treasure chest with iron bands", "a closed silver treasure chest with blue trim", "a closed gold treasure chest with red gems",
            "a closed chest made of dark-violet crystal and black stone"],
           ["the same wooden chest open, a few coins inside", "the same silver chest open, a soft glint of items inside", "the same gold chest open, full of gold",
            "the same crystal chest open, a small violet-white gem inside"]],
          ["adv_map_chest_wood", "adv_map_chest_silver", "adv_map_chest_gold", "adv_map_chest_hidden",
           "adv_map_chest_wood_open", "adv_map_chest_silver_open", "adv_map_chest_gold_open", "adv_map_chest_hidden_open"],
          PROP_FRAMING, [CHESTS], ["All chests are the same size and the same angle; row 2 shows the chests of row 1 opened."]),
    sheet("H2", "Rương giả (mimic): ngụy trang / tỉnh dậy", [1, 2],
          [["a wooden treasure chest that looks almost normal, with a tiny row of teeth along the lid and one sleepy eye slit",
            "the same chest awake as a monster: lid open like a mouth with sharp teeth and a long tongue, angry violet eyes, dark-violet corruption patches"]],
          ["adv_map_chest_mimic", "adv_map_chest_mimic_awake"], PROP_FRAMING, [CHESTS]),
    sheet("U1", "Dấu tha hóa dùng chung + hoa thanh tẩy", [2, 4],
          [["a puddle of dark-violet sludge", "cracked ground with thin dark-violet veins", "a small cluster of dark-violet crystals", "a large cluster of dark-violet crystals",
            "black thorny roots creeping on the ground", "a patch of low dark-violet mist", "a few wilted violet-grey flowers", "a patch of fresh white and golden flowers (purified ground)"]],
          ["adv_map_corrupt_sludge", "adv_map_corrupt_cracks", "adv_map_corrupt_crystal_s", "adv_map_corrupt_crystal_l",
           "adv_map_corrupt_roots", "adv_map_corrupt_mist", "adv_map_corrupt_wilted", "adv_map_purified_bloom"],
          PROP_FRAMING, [CORRUPT], [CORR]),
    sheet("U2", "Rừng bị tha hóa: biến thể", [2, 4],
          [["a withered grey oak with a few dead leaves and dark-violet veins in the bark", "a dead thorny bush", "a cluster of violet-capped corrupted mushrooms",
            "a dead pink-blossom tree with grey petals", "a mossy rock pierced by dark-violet crystals", "a rotten log with violet fungus",
            "a square texture tile of darkened murky stream water", "a square texture tile of grey wilted grass with violet veins"]],
          ["adv_map_forest_corrupt_oak", "adv_map_forest_corrupt_bush", "adv_map_forest_corrupt_mushrooms", "adv_map_forest_corrupt_blossom",
           "adv_map_forest_corrupt_rock", "adv_map_forest_corrupt_log", "adv_map_forest_corrupt_tile_water", "adv_map_forest_corrupt_tile_grass"],
          PROP_FRAMING, [ref("forest_corrupt", "how corruption already looks in my forest maps")], [CORR, "The last two are flat square seamless texture tiles seen from straight above, filling their square."]),
    sheet("U3", "Núi + Biển bị tha hóa: biến thể", [2, 4],
          [["a boulder split by dark-violet crystal veins", "a charred black pine", "an ore rock overgrown with dark-violet crystals", "a square texture tile of grey rock with violet veins",
            "bleached grey-white coral", "corrupted dark kelp with violet tips", "an oily dark tide pool with violet sheen", "a rotten driftwood log with violet crystals"]],
          ["adv_map_mountain_corrupt_boulder", "adv_map_mountain_corrupt_pine", "adv_map_mountain_corrupt_ore", "adv_map_mountain_corrupt_tile_rock",
           "adv_map_coast_corrupt_coral", "adv_map_coast_corrupt_kelp", "adv_map_coast_corrupt_pool", "adv_map_coast_corrupt_driftwood"],
          PROP_FRAMING, [ref("mountain_coast_corrupt", "how corruption already looks in my mountain and coast maps")], [CORR, "Cell 4 of row 1 is a flat square seamless texture tile seen from straight above, filling its square."]),
    sheet("U4", "Tàn Tích bị tha hóa: biến thể", [2, 4],
          [["a rune pillar split by a dark-violet crystal", "a statue fragment wrapped in black roots", "a square texture tile of cracked flagstones with violet veins",
            "a square texture tile of black sludge and rubble", "a stone brazier burning with a dark-violet flame", "a tall arch-shaped dark-violet crystal shard",
            "a ruin wall section covered in withered black vines", "a dead tree stump split by violet crystals"]],
          ["adv_map_ruins_corrupt_pillar", "adv_map_ruins_corrupt_statue", "adv_map_ruins_corrupt_tile_floor", "adv_map_ruins_corrupt_tile_sludge",
           "adv_map_ruins_corrupt_brazier", "adv_map_ruins_corrupt_shard", "adv_map_ruins_corrupt_wall", "adv_map_ruins_corrupt_stump"],
          PROP_FRAMING, [ref("ruins_corrupt", "how corruption already looks in my ruins maps")], [CORR, "Cells 3 and 4 of row 1 are flat square seamless texture tiles seen from straight above, filling their square."]),
    sheet("S1", "Suối hồi phục 4 vùng", [1, 4],
          [["a forest healing spring: a small round pool in a ring of mossy stones with ferns", "a mountain hot spring: a rocky pool with a soft steam puff",
            "a coast spring: a clear pool in a rim of big shells and coral", "a ruins fountain: a small carved stone basin with clear water"]],
          ["adv_map_spring_forest", "adv_map_spring_mountain", "adv_map_spring_coast", "adv_map_spring_ruins"], PROP_FRAMING,
          [ref("springs", "the small wells, pools and fountains of my maps")]),
    sheet("Z1", "Câu đố nguyên tố (1): 4 cặp trước / sau", [2, 4],
          [["an iron brazier, cold and unlit (FIRE puzzle)", "the same brazier burning with a warm orange flame", "a small wooden water wheel, dry and still (WATER puzzle)",
            "the same water wheel with water pouring over it", "a tall metal rod with a dull pale-blue crystal (LIGHTNING puzzle)", "the same rod with the crystal bright yellow and small sparks",
            "a round stone pressure plate, raised (EARTH puzzle)", "the same plate pressed down into the ground"]],
          ["adv_map_puzzle_brazier", "adv_map_puzzle_brazier_lit", "adv_map_puzzle_wheel", "adv_map_puzzle_wheel_on",
           "adv_map_puzzle_rod", "adv_map_puzzle_rod_on", "adv_map_puzzle_plate", "adv_map_puzzle_plate_down"],
          PROP_FRAMING, [PUZZLE], ["Each pair (cells 1-2, 3-4 of each row) is the same object, same size and angle, before and after."]),
    sheet("Z2", "Câu đố nguyên tố (2): 4 cặp trước / sau", [2, 4],
          [["a big closed green seed pod on the ground (NATURE puzzle)", "the same pod bloomed into a wide flat leaf bridge", "a round bronze gear lock, closed (METAL puzzle)",
            "the same gear lock turned open", "a curtain of dark shadow mist blocking a gap (DARK puzzle)", "the same gap with the mist gone, only a faint wisp",
            "a round stone mirror on a stand, dull (LIGHT puzzle)", "the same mirror shining warm white-gold"]],
          ["adv_map_puzzle_pod", "adv_map_puzzle_pod_open", "adv_map_puzzle_gear", "adv_map_puzzle_gear_open",
           "adv_map_puzzle_veil", "adv_map_puzzle_veil_gone", "adv_map_puzzle_mirror", "adv_map_puzzle_mirror_lit"],
          PROP_FRAMING, [PUZZLE], ["Each pair (cells 1-2, 3-4 of each row) is the same object, same size and angle, before and after."]),
    sheet("I1", "Huy hiệu 6 loại quái", [1, 6],
          [["a plain round brown badge with a simple paw print (normal monster)", "a silver badge with a star (elite)", "a violet badge with a twisted spiral (mutant)",
            "a silver badge with two small horns (sub-boss)", "a gold badge with a horned crown (main boss)", "a badge split into several element colours with a fused star (special)"]],
          ["ui_icon_foe_normal", "ui_icon_foe_elite", "ui_icon_foe_mutant", "ui_icon_foe_subboss", "ui_icon_foe_boss", "ui_icon_foe_special"], ICON_FRAMING, []),
]
if KIT:
    # Creation order: forest first (it sets the look the other zones follow), each zone ground -> edges -> covers -> props -> landmarks -> exits,
    # the shared sheets next to the zone whose hints they lean on. --redo M7,N7 appends the repaint sheets of maps still to redraw.
    by_id = {s["id"]: s for s in shared}
    order = [*kit_sheets["F"], *(by_id[i] for i in ("H1", "H2", "S1", "U1", "U2")), *kit_sheets["M"], *kit_sheets["R"], by_id["U4"],
             *kit_sheets["C"], *(by_id[i] for i in ("U3", "Z1", "Z2", "I1"))]
    redo = sys.argv[sys.argv.index("--redo") + 1].split(",") if "--redo" in sys.argv else []
    maps = {s["id"]: s for s in map_sheets}
    # A map redrawn for its style also gets an accepted painting of the same zone as a third picture.
    SIBLING = {"zone_forest": "M1", "zone_mountain": "M6", "zone_ruins": "M8", "zone_coast": "N9"}
    sib_line = ("Image {n} is another map of the same zone that I already accepted: match {subject} (colours, light, amount of detail and "
                "corruption), but keep the layout of image 2, not the layout of image {n}.")
    for c in redo:
        sib = SIBLING[LAYOUTS[c]["zone"]]
        maps[c] = dict(maps[c], refs=[*maps[c]["refs"], dict(type="accepted", src=f".batch/{B}/{sib}.png", subject=f"the look of map {sib}")],
                       prompt=dict(maps[c]["prompt"], accepted_line=sib_line))
    sheets = order + [maps[c] for c in redo]

note = (
    "Bản đồ v2 (decision 045), 18 map của 4 vùng. **Bước 1: vẽ lại 18 map** (Rừng M1–M3, N1–N3; Núi M4–M6, N4, N5; Tàn Tích M7–M9, N6; Biển N7–N9) như batch adventure-11-map: ảnh 1 = `M1-hint.png` (phong cách), "
    "ảnh 2 = ảnh before của bố cục mới (dựng bằng `scripts/art/map_layouts_v2/render.py`, ô tạm + sprite game, 1 ô = 40 px). "
    "Có thể dùng ChatGPT hoặc Gemini; nếu bố cục lệch nhiều thì tạo lại hoặc nhắn thêm: \"Keep the layout of image 2 exactly: the paths, forest, water, "
    "cliffs and every sprite must stay in the same place. Only change the art style.\" "
    "**Bước 2** (sau khi duyệt tranh): agent cắt ô nền, cây, đá, vách, lớp che... từ tranh làm ảnh chuẩn và sinh các sheet bộ ghép (`batch.py --kit`)."
)
if KIT:
    note = (
        "Bản đồ v2 (decision 045), **bước 2: bộ ghép cảnh quan**. Ảnh 1 = phong cách `M1-hint.png` (bản cận cảnh); ảnh 2 (và 3) = **ảnh chuẩn cắt từ tranh map "
        "đã duyệt** (`scripts/art/map_layouts_v2/refs.py`, thư mục `.hints/adventure-14-map-v2/ref/`). Ảnh chuẩn mờ vì tranh nhỏ: prompt dặn vẽ lại sắc nét. "
        "Tạo **theo đúng thứ tự dưới đây**: Rừng trước (chốt nét cho các vùng sau), trong mỗi vùng ô nền → vách → lớp che → đạo cụ → vật mốc → lối ra. "
        "Nếu một sheet ra lệch phong cách Rừng đã duyệt, đính kèm thêm sheet Rừng tương ứng làm ảnh tham khảo khi tạo lại."
        + (f" Cuối batch: vẽ lại map {', '.join(redo)} (phong cách chưa đạt)." if redo else "")
    )
data = dict(batch=B, title="Bản đồ Adventure v2: vẽ lại 18 map theo bố cục mới + bộ ghép cảnh quan",
            layout="", note=note, prompt=dict(style_line=STYLE_LINE, negative_line=NEGATIVE_LINE, shape_line=SHAPE_LINE, accepted_line=KIT_ACCEPTED_LINE if KIT else ACCEPTED_LINE), style_refs={"map": f"{H}/STYLE_zoom.png", "mapfull": ".batch/adventure-11-map/M1-hint.png"}, sheets=sheets)
out = ROOT / ".batch" / B
out.mkdir(parents=True, exist_ok=True)
(out / "batch.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
print(len(sheets), "sheets", sum(len(s["assets"]) for s in sheets), "assets")
