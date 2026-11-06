"""A pose-to-pose rig from a creature's six approved key poses (decision 050, 2026-11-06 (5)).

  python scripts/rig/poseRig.py <art> [<art> …]   (then: npm run rig:parts <art>)

Why: one picture bent by a grid cannot strike, cast or fall — it only leans (the owner rejected it); cut parts painted apart do not
look like the approved art. The approved key poses (`cb_<art>_{idle,attack,cast,hurt,victory,ko}`, drawn and accepted, all on one
512 canvas with the feet on one line) are the real drawings of each action and each face. So each action shows its own drawing at
its moment (poseClips.py), and the grid only adds what a drawing cannot: anticipation, squash and stretch, the head lagging, a lunge
with the feet planted, the settle. Nothing is drawn over a face.

Writes asset/rigs/<art>/layers/skin*.png (the old layers go to layers_skin1/ once) and content/anim/rigs/<art>.json (feel and
plan kept from the rig there; bones, regions, clips new). The head region is a disc around the eyes (skin_spec.json / skin.py SPEC).
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from poseClips import CLIPS  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
POSES = ["attack", "cast", "hurt", "victory", "ko"]
RES = 2
GROUNDED = {"quadruped", "heavy", "biped", "small", "flyer"}


def canvas(img: Image.Image, feet: int) -> Image.Image:
    big = img.resize((img.width * RES, img.height * RES), Image.LANCZOS)
    can = Image.new("RGBA", (512 * RES, 512 * RES), (0, 0, 0, 0))
    can.paste(big, (0, 470 * RES - feet * RES), big)
    return can


def eyes_of(art: str) -> list:
    f = ROOT / "asset/rigs" / art / "skin_spec.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))["face"]["eyes"]
    from skin import SPEC  # the hand-measured prototypes
    return [{"c": list(e["c"]), "r": list(e["r"])} for e in SPEC[art]["eyes"]]


def build(art: str) -> None:
    src = lambda p: ROOT / "public/assets/props/combat" / f"cb_{art}_{p}.png"  # noqa: E731
    idle = Image.open(src("idle")).convert("RGBA")
    al = np.array(idle)[..., 3] > 128
    ys, xs = np.nonzero(al)
    x0, x1, top, feet = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    W, H = x1 - x0, feet - top
    layers = ROOT / "asset/rigs" / art / "layers"
    keep = ROOT / "asset/rigs" / art / "layers_skin1"
    if layers.exists() and not keep.exists():
        shutil.move(str(layers), str(keep))
    layers.mkdir(parents=True, exist_ok=True)
    for f in layers.glob("*.png"):
        f.unlink()
    canvas(idle, feet).save(layers / "skin.png")
    for p in POSES:
        canvas(Image.open(src(p)).convert("RGBA"), feet).save(layers / f"skin_{p}.png")

    c = lambda x, y: [round(x - 256, 1), round(y - feet, 1)]  # noqa: E731
    eyes = eyes_of(art)
    ex = float(np.mean([e["c"][0] for e in eyes]))
    ey = float(np.mean([e["c"][1] for e in eyes]))
    R = float(np.hypot(eyes[1]["c"][0] - eyes[0]["c"][0], eyes[1]["c"][1] - eyes[0]["c"][1])) if len(eyes) == 2 else 3.0 * max(eyes[0]["r"])
    R = max(R, 0.18 * W)
    hc = (ex, ey + 0.2 * R)
    rx, ry = 1.45 * R, 1.3 * R
    # The disc around the face, open to the picture's edge on the side it borders nothing.
    disc = [(hc[0] + rx * np.cos(t), hc[1] + ry * np.sin(t)) for t in np.linspace(0, 2 * np.pi, 20, endpoint=False)]
    head_poly = [c(min(512.0, x), max(0.0, y)) for x, y in disc]

    path = ROOT / "content/anim/rigs" / f"{art}.json"
    old = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    plan = old.get("plan", "quadruped")
    feel = old.get("feel", {"tempo": 1, "weight": 0.5})
    regions = [{"bind": "body", "poly": [c(0, 0), c(512, 0), c(512, 512), c(0, 512)]}]
    if plan in GROUNDED:  # the feet stay where they stand while the body leans, squashes and lunges
        regions.append({"bind": "root", "poly": [c(0, feet - 0.1 * H), c(512, feet - 0.1 * H), c(512, 512), c(0, 512)], "soft": round(0.06 * H, 1)})
    regions.append({"bind": "head", "poly": head_poly, "soft": round(0.25 * R, 1)})
    mouth = (ex + (0.25 * R if len(eyes) == 1 else 0), ey + 0.55 * R)
    data = {
        "id": art, "plan": plan, "height": H, "res": RES,
        "feel": {"tempo": feel.get("tempo", 1), "weight": feel.get("weight", 0.5),
                 "breath": {"ms": 2600 if plan != "aquatic" else 1600, "bone": "body", "sy": 0.016, "y": 0},
                 "root": {"rot": 0.45, "squash": 0.45}},
        "parts": {},
        "bones": [
            {"id": "root", "parent": None, "at": [0, 0]},
            {"id": "body", "parent": "root", "at": c((x0 + x1) / 2, feet)},
            {"id": "head", "parent": "body", "at": c(hc[0] - 0.3 * R, hc[1] + 0.9 * ry)},
            {"id": "eyes", "parent": "head", "at": c(ex, ey)},
            {"id": "mouth", "parent": "head", "at": c(*mouth)},
            {"id": "tail", "parent": "body", "at": c(x0 + 0.08 * W, feet - 0.5 * H)},
        ],
        "chains": [],
        "skin": {"part": "skin", "grid": [32, 28], "soft": 12, "z": 0, "regions": regions,
                 "poses": {p: f"skin_{p}" for p in POSES}, "poseFade": 70},
        "springs": [{"bone": "head", "stiff": 170, "damp": 11, "gain": 0.45, "gainY": 0.3, "max": 7}],
        "clips": CLIPS,
        "anchors": {"mouth": "mouth", "tail": "tail"},
    }
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8", newline="\n")
    print(f"{art}: {plan}, 6 poses, {len(CLIPS)} clips")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    for a in sys.argv[1:]:
        build(a)
