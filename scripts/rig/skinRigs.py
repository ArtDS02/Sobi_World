"""Skeleton + skin regions of the skinned rigs (decision 050, 2026-11-06), measured on each creature's accepted picture.

  python scripts/rig/skinRigs.py <rig>   -> content/anim/rigs/<rig>.json: joints, chains, `skin` (then: npm run rig:parts <rig>)

Every point is in px of the accepted picture (512²); FEET is the picture's feet line, written to the canvas as (x - 256, y - FEET).
Bones keep their ids, so every clip, spring and anchor of the rig still applies; the bones that carried cut parts carry none now.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

RIGS: dict[str, dict] = {
    "pig_boar": {
        "feet": 492,
        "grid": [32, 28],
        "soft": 10,
        "keep_parts": {"snout"},
        # One picture bends, it does not reveal: the clips made for cut parts turn a head or an ear further than a skin can follow.
        "damp": {"head": 0.65, "ear_near": 0.45, "ear_far": 0.5, "mane": 0.5},
        "springs": {"ear_near": 12, "ear_far": 14, "mane": 8, "head": 9},
        "bones": {
            "hips": (215, 400), "body": (215, 400),
            "leg_bl": (193, 436), "leg_fl": (345, 436), "leg_br": (130, 412), "leg_fr": (268, 410),
            "head": (305, 360), "mane": (320, 150), "ear_far": (420, 205), "ear_near": (268, 238),
            "mouth": (414, 331), "snout": (400, 300), "eyes": (380, 255),
        },
        "chains": {"tail": {"at": (85, 330), "dir": 240, "len": 80}},
        # Bottom to top: a later region lies over the earlier ones.
        "regions": [
            ("body", [(0, 0), (512, 0), (512, 512), (0, 512)]),
            ("leg_br", [(90, 420), (166, 420), (166, 500), (90, 500)]),
            ("leg_bl", [(170, 436), (224, 436), (224, 500), (170, 500)]),
            ("leg_fr", [(228, 422), (312, 422), (312, 500), (228, 500)]),
            ("leg_fl", [(314, 436), (388, 436), (388, 500), (314, 500)]),
            ("tail", [(0, 230), (60, 230), (95, 262), (100, 318), (88, 352), (50, 352), (0, 330)]),
            # Out to the picture's edge where the head borders nothing: empty grid there must follow the head, or a turn shears it.
            ("head", [(255, 100), (300, 0), (512, 0), (512, 362), (460, 372), (410, 385), (355, 382), (310, 368), (282, 340),
                      (262, 300), (250, 250), (248, 200)]),
            ("mane", [(255, 98), (290, 74), (330, 84), (362, 78), (392, 108), (388, 152), (332, 150), (272, 162)]),
            ("ear_near", [(168, 178), (210, 150), (264, 156), (290, 196), (286, 254), (258, 288), (212, 284), (176, 250)], 18),
            ("ear_far", [(392, 128), (405, 70), (512, 70), (512, 215), (456, 216), (424, 206), (398, 176)]),
            ("snout", [(332, 318), (345, 302), (366, 288), (378, 262), (420, 249), (470, 260), (494, 290), (491, 340), (466, 354),
                       (420, 349), (386, 357), (337, 354)]),
        ],
    },
    "pig_turtle": {
        "feet": 492,
        "grid": [32, 28],
        "soft": 10,
        "keep_parts": {"snout"},
        "damp": {"head": 0.65, "ear_near": 0.45, "ear_far": 0.5, "shell": 0.7, "leaf": 0.7},
        "springs": {"ear_near": 12, "ear_far": 14, "leaf": 12, "shell": 6, "head": 9},
        "bones": {
            "hips": (230, 400), "body": (230, 400), "shell": (160, 300), "leaf": (210, 165),
            "leg_bl": (185, 440), "leg_fl": (345, 440), "leg_br": (125, 425), "leg_fr": (268, 428),
            "head": (330, 360), "ear_far": (385, 165), "ear_near": (288, 192),
            "mouth": (391, 320), "snout": (414, 292), "eyes": (380, 258),
        },
        "chains": {"tail": {"at": (66, 292), "dir": 248, "len": 52}},
        "regions": [
            ("body", [(0, 0), (512, 0), (512, 512), (0, 512)]),
            ("leg_br", [(84, 425), (158, 425), (158, 500), (84, 500)]),
            ("leg_bl", [(160, 440), (218, 440), (218, 500), (160, 500)]),
            ("leg_fr", [(230, 430), (305, 430), (305, 500), (230, 500)]),
            ("leg_fl", [(307, 440), (390, 440), (390, 500), (307, 500)]),
            ("shell", [(0, 395), (0, 250), (60, 170), (150, 130), (250, 135), (285, 190), (288, 260), (278, 335), (285, 382),
                       (262, 402), (150, 404)]),
            ("tail", [(0, 210), (80, 210), (86, 262), (74, 306), (40, 312), (0, 300)]),
            ("leaf", [(100, 60), (300, 60), (300, 160), (260, 185), (200, 195), (140, 185), (100, 170)]),
            ("head", [(275, 150), (300, 110), (512, 110), (512, 350), (470, 335), (420, 368), (365, 378), (310, 365), (282, 335),
                      (268, 290), (270, 220)]),
            ("ear_near", [(170, 195), (222, 170), (292, 172), (306, 212), (300, 262), (270, 296), (212, 296), (176, 266)], 18),
            ("ear_far", [(360, 150), (375, 110), (512, 110), (512, 250), (472, 238), (425, 205), (372, 182)]),
            ("snout", [(378, 280), (395, 265), (425, 261), (449, 268), (453, 295), (441, 319), (410, 323), (385, 314)]),
        ],
    },
    "fish_betta": {
        "feet": 492,
        "grid": [32, 28],
        "soft": 14,
        "keep_parts": set(),
        "damp": {"head": 0.7, "spine": 0.5, "tail_fin": 0.45, "veil_top": 0.4, "veil_low": 0.4, "fin_pec": 0.5},
        "wave": 0.55,
        "springs": {"fin_pec": 14},
        "bones": {"swim": (300, 305), "head": (350, 300), "fin_pec": (362, 312), "mouth": (450, 314), "eyes": (416, 311)},
        "chains": {
            "spine": {"at": (345, 300), "dir": 188, "len": 120},
            "tail_fin": {"at": (0, 0), "dir": 0, "len": 165},
            # Fins root at the end where they join the body, so the whole fin lies ahead of its root.
            "veil_top": {"at": (348, 258), "dir": 214, "len": 200},
            "veil_low": {"at": (392, 348), "dir": 147, "len": 230},
        },
        # Silk fins: wide blends between them, so they flow into each other instead of shearing.
        "regions": [
            ("swim", [(0, 0), (512, 0), (512, 512), (0, 512)]),
            ("veil_low", [(150, 330), (330, 330), (405, 350), (415, 512), (150, 512)], 30),
            ("veil_top", [(150, 100), (355, 100), (352, 262), (240, 268), (200, 250), (150, 230)], 30),
            ("tail_fin", [(0, 120), (225, 120), (234, 280), (226, 330), (200, 480), (0, 480)], 30),
            ("spine", [(215, 265), (330, 250), (345, 345), (300, 350), (215, 320)]),
            ("head", [(335, 245), (512, 245), (512, 372), (330, 372)]),
            ("fin_pec", [(312, 298), (372, 298), (376, 372), (312, 372)], 14),
        ],
    },
    "octopus": {
        "feet": 492,
        "grid": [32, 28],
        "soft": 12,
        "keep_parts": set(),
        "damp": {"mantle": 0.7, "arm_b1": 0.4, "arm_b2": 0.4, "arm_f1": 0.45, "arm_f2": 0.45, "arm_f3": 0.45, "arm_f4": 0.45},
        "wave": 0.7,
        "springs": {},
        "bones": {"float": (256, 330), "mantle": (250, 345), "mouth": (295, 276), "eyes": (290, 258)},
        # Each arm as drawn: its root at the mantle, its direction to the tip, and the way its tip hooks (+ = clockwise).
        "chains": {
            "arm_b1": {"at": (170, 330), "dir": 188, "len": 140, "curl": -40},
            "arm_b2": {"at": (352, 315), "dir": 322, "len": 130, "curl": 50},
            "arm_f1": {"at": (195, 368), "dir": 145, "len": 150, "curl": -40},
            "arm_f2": {"at": (255, 378), "dir": 165, "len": 145, "curl": 30},
            "arm_f3": {"at": (285, 372), "dir": 75, "len": 120, "curl": -60},
            "arm_f4": {"at": (330, 355), "dir": 12, "len": 150, "curl": 60},
        },
        "regions": [
            ("float", [(0, 0), (512, 0), (512, 512), (0, 512)]),
            ("arm_b1", [(0, 280), (175, 280), (185, 325), (160, 350), (95, 362), (55, 362), (0, 372)]),
            ("arm_b2", [(345, 200), (512, 200), (512, 330), (400, 335), (352, 330)]),
            ("arm_f1", [(0, 372), (55, 362), (200, 356), (215, 378), (150, 388), (118, 395), (112, 512), (0, 512)]),
            ("arm_f2", [(118, 395), (150, 388), (215, 378), (262, 370), (270, 512), (112, 512)]),
            ("arm_f3", [(262, 360), (305, 352), (335, 400), (390, 432), (390, 512), (270, 512)]),
            ("arm_f4", [(300, 345), (512, 330), (512, 512), (390, 512), (390, 432), (335, 400)]),
            ("mantle", [(100, 0), (420, 0), (390, 300), (345, 345), (300, 355), (255, 368), (205, 358), (170, 330), (110, 300)]),
        ],
    },
}


def apply(rig: str) -> None:
    spec = RIGS[rig]
    feet = spec["feet"]
    c = lambda p: [round(p[0] - 256, 1), round(p[1] - feet, 1)]  # noqa: E731
    path = ROOT / "content/anim/rigs" / f"{rig}.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    for b in data["bones"]:
        if b["id"] in spec["bones"]:
            b["at"] = c(spec["bones"][b["id"]])
        if "part" in b and b["part"] not in spec["keep_parts"]:
            del b["part"]
    if "skin" not in data:  # once, when a cut-part rig becomes a skinned one
        for clip in data["clips"].values():
            for bone, k in spec["damp"].items():
                for ch, keys in clip["tracks"].get(bone, {}).items():
                    for key in keys:
                        key[1] = round(key[1] * k, 2) if ch in ("rot", "x", "y") else round(1 + (key[1] - 1) * k, 3)
        k = spec.get("wave", 1)
        for ch in data["chains"]:
            ch["wave"]["amp"] = round(ch["wave"]["amp"] * k, 2)
        for clip in data["clips"].values():
            for w in clip.get("waves", {}).values():
                w["amp"] = round(w["amp"] * k, 2)
        for sp in data["springs"]:
            if sp["bone"] in spec["springs"]:
                sp["max"] = spec["springs"][sp["bone"]]
                sp["gain"] = round(sp["gain"] * 0.6, 2)
                sp["gainY"] = round(sp.get("gainY", 0) * 0.6, 2)
    for ch in data["chains"]:
        s = spec["chains"].get(ch["id"])
        if s:
            # A chain on the tip of another one keeps its `at` (unused there).
            ch["at"] = c(s["at"]) if s["at"] != (0, 0) else ch["at"]
            ch["dir"], ch["len"] = s["dir"], s["len"]
            if "curl" in s:
                ch["curl"] = s["curl"]
            ch.pop("part", None)
    data["skin"] = {"part": "skin", "grid": spec["grid"], "soft": spec["soft"], "z": 0,
                    "regions": [{"bind": g[0], "poly": [c(p) for p in g[1]], **({"soft": g[2]} if len(g) > 2 else {})} for g in spec["regions"]]}
    # The skin sits under everything the rig still draws (faces, a snout over a moving mouth).
    keys = list(data.keys())
    order = keys[: keys.index("chains") + 1] + ["skin"] + [k for k in keys[keys.index("chains") + 1:] if k != "skin"]
    path.write_text(json.dumps({k: data[k] for k in order}, ensure_ascii=False), encoding="utf-8", newline="\n")
    print(f"{rig}: skin with {len(spec['regions'])} regions")


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in RIGS:
        print(__doc__)
        sys.exit(1)
    apply(sys.argv[1])
