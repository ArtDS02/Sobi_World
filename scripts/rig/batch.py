"""Gemini batch for the painted layers of the puppets (decision 050) and the step that puts them back on the rig.

  python scripts/rig/batch.py make            -> art_inbox/.batch/rig-01-layers/batch.json + hints (then: art.py prep rig-01-layers)
  python scripts/rig/batch.py place <rig> [v] -> candidates (npm run rig:cut) -> asset/rigs/<rig>/layers/<layer>.png (then: npm run rig:parts <rig>)

A sheet asks for the parts of ONE creature drawn apart ("exploded view", each part whole, nothing hidden), or for its eyes / mouths.
Nobody has to line anything up by hand: `place` scales each cut part into the box its rig-proof part has in the 512 canvas (the
joints of the rig stay where they are) and writes it as a full 1024 canvas layer; far legs / far ears are shaded copies of near ones.
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "art_inbox"
BATCH = "rig-01-layers"
CELL = 512
GREY = (200, 200, 200, 255)
ORIGIN = (256, 470)
RES = 2

STYLE = ".batch/adventure-02-maps/1_style_creature.png"
ACCEPTED = {
    "pig_boar": ROOT / "public/assets/props/combat/cb_pig_boar_idle.png",
    "pig_turtle": ROOT / "public/assets/props/combat/cb_pig_turtle_idle.png",
    "fish_betta": ROOT / "public/assets/props/combat/cb_fish_betta_idle.png",
    "octopus": ROOT / "public/assets/props/fish_octopus.png",
}
IDENTITY = {
    "pig_boar": "Wild Boar Pig: a brown boar piglet with a spiky dark-brown mane along its nape, light spots on its back, a pink snout with two small cream tusks curving up, pointed ears, short legs with dark hooves",
    "pig_turtle": "Turtle Pig: a soft pink pig wearing a big green turtle shell with hexagon plates and a cream rim, a two-leaf sprout on top of the shell, floppy pink ears, short legs with mossy-green hooves",
    "fish_betta": "Betta Fish: a rose-red betta fish with long flowing violet-and-red silk fins and a big round cute eye",
    "octopus": "Little Octopus: a soft orange octopus with a round head, a few darker spots, cream suction cups and big shiny eyes",
}
NAME = {"pig_boar": "Wild Boar Pig", "pig_turtle": "Turtle Pig", "fish_betta": "Betta Fish", "octopus": "Little Octopus"}

STRAIGHT = "drawn perfectly STRAIGHT and HORIZONTAL like a ribbon laid flat, its base (where it joins the body) at the LEFT end and its tip at the RIGHT end"

# The parts sheets: (rig, sheet id, grid, [(source stem part, cell text)]).
PARTS = {
    "pig_boar": ("B1", [2, 4], [
        ("body", "the BODY alone: an egg-shaped furry trunk with the light belly and back spots, no head, no legs, no tail; its front end is painted complete (normally hidden under the head)"),
        ("head", "the HEAD alone: a big round furry head seen three-quarter to the right, with the cheek blush, but NO eyes, NO mouth, NO snout, NO ears (blank face)"),
        ("snout", "the SNOUT alone: the pink snout disc with two nostrils and the two small cream tusks curving up from its lower edge"),
        ("mane", "the MANE alone: the tuft of dark-brown spiky bristles that runs along the nape, as one piece"),
        ("ear", "one EAR alone: pointed brown ear standing up, pink inside, with a short rounded base"),
        ("leg_front", "one FRONT LEG alone: a short straight leg with a dark hoof, standing straight down, a rounded top"),
        ("leg_back", "one BACK LEG alone: a short straight hind leg with a dark hoof, standing straight down, a rounded top"),
        ("tail", f"the TAIL alone: a thin tail with a small tuft of dark bristles at the tip, {STRAIGHT}"),
    ]),
    "pig_turtle": ("T1", [2, 4], [
        ("body", "the pink BODY alone: the round pink trunk and belly, no shell, no head, no legs; painted complete (normally hidden under the shell)"),
        ("shell", "the SHELL alone: a big green dome shell with hexagon plates and the cream rim along its lower edge, seen from the side, no sprout on it"),
        ("leaf", "the SPROUT alone: a short green stem with two round leaves opening to each side"),
        ("head", "the HEAD alone: a round pink pig head seen three-quarter to the right, with the cheek blush and a short neck behind it, but NO eyes, NO mouth, NO snout, NO ears"),
        ("ear", "one EAR alone: a soft floppy pink ear, pink inside"),
        ("snout", "the SNOUT alone: a big pink snout disc with two nostrils"),
        ("leg", "one LEG alone: a short chubby pink leg with a mossy-green hoof, standing straight down, a rounded top"),
        ("tail", "the TAIL alone: a curly pink piggy tail making one loop, lying flat"),
    ]),
    "fish_betta": ("F1", [2, 3], [
        ("head", "the HEAD alone: the front of the fish (head and gill cover) seen from the side facing right, cut off cleanly just behind the gill, with NO eye and NO mouth"),
        ("fin_pec", "one small PECTORAL FIN alone: a little fan-shaped violet fin"),
        ("spine", f"the BODY behind the head alone: the scaly red body from the gills to the tail base, thick at the base and thinner at the tip, the lighter belly along its UPPER edge, {STRAIGHT}"),
        ("tail_fin", f"the TAIL FIN alone: a big flowing violet-and-red silk fan with fin rays, narrow at the base and very wide at the tip, {STRAIGHT}"),
        ("veil_top", f"the long DORSAL FIN alone: a silky violet veil, narrow at the base and wider at the tip, {STRAIGHT}"),
        ("veil_low", f"the long BELLY FIN alone: a smaller silky violet veil, narrow at the base and wider at the tip, {STRAIGHT}"),
    ]),
    "octopus": ("O1", [1, 3], [
        ("mantle", "the HEAD alone: the round soft orange head (mantle) with a few darker spots and the cheek blush, but NO eyes, NO mouth and NO arms"),
        ("arm", f"one ARM alone: a soft orange tentacle, thick at the base and thin at the tip, a row of cream suction cups along its LOWER edge, {STRAIGHT}"),
        ("arm_back", f"one BACK ARM alone: the same tentacle a little darker orange, suction cups paler, {STRAIGHT}"),
    ]),
}

EYES = [
    ("eyes_open", "the EYES open: big round shiny eyes with two white highlights"),
    ("eyes_half", "the EYES half-closed, sleepy"),
    ("eyes_closed", "the EYES closed: two gentle curved lines"),
    ("eyes_angry", "the EYES angry: determined round eyes under frowning brows"),
    ("eyes_hurt", "the EYES hurt: squeezed shut like > < with one small cartoon tear"),
    ("eyes_dizzy", "the EYES dizzy: cartoon spirals"),
    ("eyes_happy", "the EYES happy: closed upward curves ^ ^"),
]
MOUTHS = [
    ("mouth_neutral", "the MOUTH at rest: a small soft line"),
    ("mouth_open", "the MOUTH wide open in a shout, little pink tongue"),
    ("mouth_grit", "the MOUTH gritting its teeth"),
    ("mouth_smile", "the MOUTH in a big open smile"),
    ("mouth_cry", "the MOUTH wobbly, about to cry"),
]
FACE_ID = {"pig_boar": "B", "pig_turtle": "T", "fish_betta": "F", "octopus": "O"}

# The layers a rig needs that come from another cut part: far legs / ears are the near one, shaded (it sits further from the light).
DERIVED = {
    "pig_boar": {"leg_fr": ("leg_front", 1.0), "leg_fl": ("leg_front", 0.82), "leg_br": ("leg_back", 1.0), "leg_bl": ("leg_back", 0.82), "ear_near": ("ear", 1.0), "ear_far": ("ear", 0.82)},
    "pig_turtle": {"leg_fr": ("leg", 1.0), "leg_fl": ("leg", 0.85), "leg_br": ("leg", 1.0), "leg_bl": ("leg", 0.85), "ear_near": ("ear", 1.0), "ear_far": ("ear", 0.85)},
    "fish_betta": {},
    "octopus": {},
}
# Rig-proof part to draw in a hint cell for a source part that has no proof of its own name.
PROOF_OF = {"leg_front": "leg_fr", "leg_back": "leg_br", "ear": "ear_near", "leg": "leg_fr"}


def stem(rig: str, part: str) -> str:
    return f"rigsrc_{rig}_{part}"


def proof(rig: str, part: str) -> Path:
    return ROOT / "public/assets/props/rig" / rig / f"rig_{rig}_{PROOF_OF.get(part, part)}.png"


def grid_hint(rig: str, parts: list[str], grid: list[int], out: Path) -> None:
    """The rig-proof parts in the cells of the sheet, as big as the cell allows: the shape of each cell, never a style source."""
    rows, cols = grid
    img = Image.new("RGBA", (cols * CELL, rows * CELL), GREY)
    for i, part in enumerate(parts):
        p = Image.open(proof(rig, part)).convert("RGBA")
        k = min((CELL * 0.74) / p.width, (CELL * 0.74) / p.height)
        p = p.resize((max(1, round(p.width * k)), max(1, round(p.height * k))), Image.LANCZOS)
        x = (i % cols) * CELL + (CELL - p.width) // 2
        y = (i // cols) * CELL + (CELL - p.height) // 2
        img.alpha_composite(p, (x, y))
    out.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(out)


def make() -> None:
    hints = ART / ".hints" / BATCH
    sheets = []
    for rig, (sid, grid, cells) in PARTS.items():
        acc = hints / f"{rig}_look.png"
        hints.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ACCEPTED[rig], acc)
        look = {"type": "accepted", "src": f".hints/{BATCH}/{rig}_look.png", "subject": f"this exact creature ({NAME[rig]}) as it already is in my game"}
        names = [c[0] for c in cells]
        grid_hint(rig, names, grid, hints / f"{sid}_layout.png")
        cols = grid[1]
        sheets.append({
            "id": sid,
            "title": f"{NAME[rig]} ({rig}): bộ phận rời",
            "mode": "sheet", "kind": "creature", "style": "creature", "grid": grid,
            "refs": [look, {"type": "shape", "src": f".hints/{BATCH}/{sid}_layout.png", "subject": "which body part goes in which cell and its rough shape (a flat placeholder drawing of the same parts)"}],
            "rows": [[c[1] for c in cells[r * cols:(r + 1) * cols]] for r in range(grid[0])],
            "extra": [
                f"All cells are separate BODY PARTS of ONE creature, like a cut-out puppet kit laid out flat: {IDENTITY[rig]}. Keep every part IDENTICAL to image 2 in colours, markings, line and proportions, as if cut out of that very picture.",
                "Draw each part COMPLETE and whole, as if the other parts had been taken away: the area normally hidden behind other parts is painted too. Every part in a calm neutral rest position, seen three-quarter from the side, the creature facing RIGHT.",
            ],
            "framing": "A cut-out puppet kit sheet: each cell holds exactly ONE separate body part, centred, filling about 70 % of the cell. No other body around it, no joints, no pins, no shadow, no effects, no text.",
            "trim": "tight",
            "assets": [stem(rig, c[0]) for c in cells],
        })
        # Faces: the eyes (+ the resting mouth) on one sheet, the other mouths on a second.
        f = FACE_ID[rig]
        two = "two eyes side by side (the far eye a little smaller and closer to the middle)" if rig != "fish_betta" else "ONE eye (the fish is seen from the side)"
        face_extra = [
            f"Every cell shows ONLY a piece of the face of the creature in image 2 ({NAME[rig]}), floating alone exactly as it sits on its face in three-quarter view facing right: no head, no snout, no skin around it.",
            f"The eye cells show {two}; every eye cell has the SAME size and the SAME spacing so they can be swapped one for another. The mouth cells are small, all the SAME size.",
            "Same line and colours as image 2's eyes and mouth.",
        ]
        eye_cells = EYES + MOUTHS[:1]
        grid_hint(rig, [e[0] for e in eye_cells], [2, 4], hints / f"{f}2_layout.png")
        grid_hint(rig, [m[0] for m in MOUTHS[1:]], [1, 4], hints / f"{f}3_layout.png")
        face_look = dict(look, subject=f"this exact creature ({NAME[rig]}): its eyes and mouth are what to draw")
        for fid, gr, fc in ((f"{f}2", [2, 4], eye_cells), (f"{f}3", [1, 4], MOUTHS[1:])):
            sheets.append({
                "id": fid,
                "title": f"{NAME[rig]} ({rig}): {'mắt + miệng nghỉ' if fid.endswith('2') else 'miệng'}",
                "mode": "sheet", "kind": "creature", "style": "creature", "grid": gr,
                "refs": [face_look, {"type": "shape", "src": f".hints/{BATCH}/{fid}_layout.png", "subject": "which expression goes in which cell (a flat placeholder drawing)"}],
                "rows": [[c[1] for c in fc[r * gr[1]:(r + 1) * gr[1]]] for r in range(gr[0])],
                "extra": face_extra,
                "framing": "A face-parts sheet for a cartoon puppet: each cell holds only that piece of the face, centred, filling about 55 % of the cell. No head, no skin patch behind it, no shadow, no effects, no text.",
                "trim": "tight",
                "assets": [stem(rig, c[0]) for c in fc],
            })
    data = {
        "batch": BATCH,
        "title": "Layer bộ phận cho puppet rig (decision 050): Heo Rừng, Heo Rùa, Cá Betta, Bạch Tuộc",
        "layout": "",
        "note": "Mỗi con 3 sheet: bộ phận rời (như bộ rối giấy cắt sẵn, mỗi bộ phận vẽ trọn vẹn), mắt + miệng nghỉ, các miệng còn lại. Ảnh 2 = ảnh hiện tại của con đó (giữ nhận diện); ảnh 3 = bản vẽ tạm đang chạy trong game, chỉ để biết ô nào là bộ phận nào. KHÔNG cần căn chỉnh gì: sau khi lưu sheet, Claude chạy art.py cut + scripts/rig/batch.py place tự đặt từng bộ phận về đúng khớp. Thứ tự ưu tiên: B1–B3 (Heo Rừng) → T1–T3 → F1–F3 → O1–O3.",
        "style_refs": {"creature": STYLE},
        "sheets": sheets,
    }
    out = ART / ".batch" / BATCH / "batch.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"OK {out.relative_to(ROOT)} ({len(sheets)} sheets)")


def place(rig: str, variant: str) -> None:
    """Puts every cut part of `rig` into the box its rig-proof part has, as a full-canvas layer."""
    data = json.loads((ROOT / "content/anim/rigs" / f"{rig}.json").read_text(encoding="utf-8"))
    # Target = the rig-proof box, frozen once (rig:parts rewrites the rig's boxes from the painted layers).
    frozen = ROOT / "asset/rigs" / rig / "proof_boxes.json"
    if not frozen.exists():
        frozen.write_text(json.dumps({k: v["box"] for k, v in data["parts"].items()}), encoding="utf-8", newline="\n")
    boxes = json.loads(frozen.read_text(encoding="utf-8"))
    ribbons = {c["part"] for c in data.get("chains", [])}
    cand = ART / ".candidates"
    out_dir = ROOT / "asset/rigs" / rig / "layers"
    out_dir.mkdir(parents=True, exist_ok=True)
    wanted: dict[str, tuple[str, float]] = {name: (name, 1.0) for name in boxes}
    wanted.update(DERIVED.get(rig, {}))
    done, missing = [], []
    for layer, (src, shade) in wanted.items():
        f = cand / f"{stem(rig, src)}_{variant}.png"
        if not f.exists():
            missing.append(layer)
            continue
        part = Image.open(f).convert("RGBA")
        bbox = part.getbbox()
        if bbox:
            part = part.crop(bbox)
        if shade != 1.0:
            rgb = ImageEnhance.Brightness(part.convert("RGB")).enhance(shade)
            rgb.putalpha(part.getchannel("A"))
            part = rgb
        x, y, w, h = boxes[layer]
        # Contain-fit into the proof's box: the joint (set in the rig) stays inside the part. Legs hang from their top, the rest centred.
        # A chain picture is a ribbon the rope re-bends along its length anyway: it fills the box, so it keeps the proof's thickness.
        k = min(w * RES / part.width, h * RES / part.height)
        size = (round(w * RES), round(h * RES)) if layer in ribbons else (round(part.width * k), round(part.height * k))
        part = part.resize((max(1, size[0]), max(1, size[1])), Image.LANCZOS)
        bx, by = (x + ORIGIN[0]) * RES, (y + ORIGIN[1]) * RES
        px = round(bx + (w * RES - part.width) / 2)
        py = round(by if layer.startswith("leg") else by + (h * RES - part.height) / 2)
        canvas = Image.new("RGBA", (512 * RES, 512 * RES), (0, 0, 0, 0))
        canvas.alpha_composite(part, (px, py))
        canvas.save(out_dir / f"{layer}.png")
        done.append(layer)
    print(f"{rig}: {len(done)} layers -> {out_dir.relative_to(ROOT)}")
    if missing:
        print(f"  still rig-proof (no candidate {variant}): {', '.join(missing)}")


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "make":
        make()
    elif len(sys.argv) >= 3 and sys.argv[1] == "place":
        place(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "a")
    else:
        print(__doc__)
        sys.exit(1)
