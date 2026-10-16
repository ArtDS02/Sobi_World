#!/usr/bin/env python3
"""art.py - batch toolkit for the image-to-prompt skill.

One CLI over the whole pipeline:

    layout.png -> manifest -> hints -> PROMPT.md -> (human runs Gemini)
              -> sheets -> cut -> candidates -> check -> approve -> art_inbox/

Subcommands
    init     scaffold a batch manifest next to its working directory
    hint     crop a region out of a layout/reference into a staged hint image
    prep     validate the manifest, stage every attachment, write PROMPT.md
    cut      split a generated sheet into transparent per-asset candidates
    check    compare what is on disk against what the manifest promised
    approve  promote a candidate to the approved asset folder
    status   one table for every batch

Only PIL + numpy are required (both already present on this machine).

Paths: every path in a manifest is relative to the art root (default
`art_inbox/`), so a manifest stays valid when the tree is moved.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

# --------------------------------------------------------------------------
# The art profile
#
# Everything that describes ONE project's house style lives here, not in the
# code paths. DEFAULT_PROFILE is the style these scripts were tuned against;
# `<root>/profile.json` overrides any part of it, so a different game - a
# different outline, palette, background colour, set of asset kinds - is a
# config change, not a fork of this script.
#
# Run `art.py profile --init` to write the defaults out as an editable file.
# --------------------------------------------------------------------------

DEFAULT_PROFILE: dict = {
    # One sentence describing the art style, used as the "image 1" instruction.
    # {n} is the attachment number. The closing "Do NOT copy the objects"
    # sentence is load-bearing: without it the model redraws the reference.
    "style_line": (
        "Image {n} is the STYLE REFERENCE: finished art from my game. Copy its art style "
        "exactly: a dark warm-brown outline (never black) of even weight, soft cel shading "
        "with one shadow tone and one highlight tone, light from the top-left, warm pastel "
        "colours of medium saturation, a subtle painted texture, rounded chunky friendly "
        "shapes, low-to-medium detail. Do NOT copy the objects of image {n}."
    ),
    "accepted_line": (
        "Image {n} is the accepted look of {subject}: match its shape, colours and shading "
        "closely, but leave out any text or letters."
    ),
    # The parenthetical names what is WRONG with an off-style reference, so it must
    # describe the kind of reference this project actually gets handed.
    "shape_line": (
        "Image {n} only shows the SHAPE idea for {subject}. Ignore its style completely "
        "(its heavy outline, glossy look, cloud pedestal and captions are wrong for my game)."
    ),
    "sheet_opener": (
        "Draw ONE image: a sheet of {count} separate game sprites in a clean grid of "
        "{rows} row(s) x {cols} column(s), in exactly this order, left to right, top to bottom:"
    ),
    "single_opener": (
        "Draw ONE image containing exactly one object, centred, fully visible, with empty "
        "space around it."
    ),
    "separation_line": (
        "Every object is fully visible and centred in its own cell, with wide empty gaps "
        "between objects; nothing touches, overlaps or crosses into another cell. "
        "Wide landscape image."
    ),
    # {hex} is filled from sheet_bg and {name} from sheet_bg_name, so the colour the
    # prompt asks for and the colour `cut` keys on can never drift apart - and the
    # adjective cannot be left saying "light-grey" after someone picks a dark flat.
    "background_line": (
        "Background: one plain flat {name} colour ({hex}) everywhere. No gradient, "
        "no texture, no floor, no cast shadow on the background."
    ),
    "negative_line": (
        "No text, letters, numbers, labels, captions, watermark, logo, border or frame. "
        "Not glossy, not a 3D render, not flat vector, not pixel art. No glow, no sparkles, "
        "no floating particles."
    ),
    # Framing clause per asset kind. A sheet picks one with "kind" and may override
    # the sentence outright with "framing". Add project kinds here.
    "framing": {
        "item": (
            "Each icon is front-on, centred and fills most of its cell; readable at 48 px. "
            "No ground, no shadow, no pedestal or cloud platform, no container, no button frame."
        ),
        "flora": (
            "Each plant is seen from the side and slightly above, standing upright; its stem "
            "ends at the bottom in a very small mound of soil. No pot, no grass patch, "
            "no ground, no cloud platform."
        ),
        "building": (
            "Three-quarter view from slightly above; each object stands on a small patch of "
            "grass with a few flowers at its foot and a soft contact shadow."
        ),
        "building_cloud": (
            "Three-quarter view from slightly above. The object stands on its own small fluffy "
            "white cloud patch (like image 1's cloud) with a soft contact shadow, as in image 1."
        ),
        "creature": "Full body, cute and friendly, in the style of image 1.",
        "bg": (
            "A full-bleed 16:9 landscape scene that fills the whole image edge to edge (this one "
            "has NO grey background). Soft, low-contrast, slightly desaturated so sprites stay "
            "readable on top; the lower 60 % is calm and mostly empty for gameplay."
        ),
    },
    # Kinds drawn edge to edge: no separation clause, no flat background, never cut.
    "full_bleed_kinds": ["bg"],
    # The flat sheet background. `cut` keys on this exact value.
    "sheet_bg": "#C8C8C8",
    # How to say that colour in words; fills {name} in background_line. Change it
    # whenever you change sheet_bg, or the prompt will contradict itself.
    "sheet_bg_name": "light-grey",
    # Per-channel tolerance when deciding a pixel is background. Raise it if the model
    # renders a slightly noisy flat; lower it if light sprite pixels are being eaten.
    "bg_tolerance": 20,
    # Name prefixes this project uses, purely for `check` to report unknown ones.
    # Empty list = do not check prefixes at all.
    "prefixes": [
        "bg_", "bld_", "plot_", "prop_", "crop_", "flower_", "fish_",
        "ui_item_", "ui_hud_", "ui_btn_", "ui_icon_", "ui_area_", "ui_badge_", "ui_avatar_",
        "ui_",
    ],
}

# Chrome of the generated PROMPT.md. Vietnamese because the people who run the
# browser step read Vietnamese; the prompts themselves stay English for the model.
HOWTO = (
    "Cách làm cho mỗi sheet: mở Gemini (gemini.google.com hoặc aistudio.google.com, chọn model "
    "tạo ảnh) → **cuộc trò chuyện mới** → đính kèm đúng các file theo thứ tự → dán prompt → "
    "tải ảnh về, lưu PNG đúng tên vào thư mục làm việc. Muốn thử thêm phiên bản: tạo lại và lưu "
    "`<tên>-2.png`, `<tên>-3.png`."
)

EDIT_NOTE = "Nên dùng **Google AI Studio** để ảnh không có watermark."

GENERATED_BY = (
    "<!-- Generated by .claude/skills/image-to-prompt/scripts/art.py prep {batch} "
    "from {manifest}. Do not edit by hand. -->"
)

PROFILE_FILE = "profile.json"
ASSET_RE = re.compile(r"^[a-z][a-z0-9_]*$")


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    v = value.strip().lstrip("#")
    if len(v) != 6:
        die(f"sheet_bg must be #RRGGBB - got {value!r}")
    try:
        return (int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16))
    except ValueError:
        die(f"sheet_bg is not valid hex: {value!r}")


def load_profile(root: Path) -> dict:
    """DEFAULT_PROFILE, overlaid with <root>/profile.json if it exists.

    Shallow merge everywhere except "framing", which merges per key so a project
    can add one kind without restating the whole table.
    """
    profile = json.loads(json.dumps(DEFAULT_PROFILE))
    path = root / PROFILE_FILE
    if not path.exists():
        return profile
    try:
        override = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        die(f"{path} is not valid JSON: {exc}")
    for key, value in override.items():
        if key == "framing" and isinstance(value, dict):
            profile["framing"].update(value)
        elif key in profile:
            profile[key] = value
        else:
            die(f"{PROFILE_FILE}: unknown key {key!r} (see `art.py profile --init`)")
    return profile


# --------------------------------------------------------------------------
# Manifest model
# --------------------------------------------------------------------------


@dataclass
class Ctx:
    """Resolved locations and the active art profile for one run."""

    root: Path          # the art root, e.g. .../art_inbox
    profile: dict       # DEFAULT_PROFILE merged with <root>/profile.json

    @property
    def bg_rgb(self) -> tuple[int, int, int]:
        return hex_to_rgb(self.profile["sheet_bg"])

    @property
    def bg_tol(self) -> int:
        return int(self.profile["bg_tolerance"])

    def is_full_bleed(self, kind: str) -> bool:
        return kind in set(self.profile["full_bleed_kinds"])

    @property
    def batch_dir(self) -> Path:
        return self.root / ".batch"

    @property
    def candidates(self) -> Path:
        return self.root / ".candidates"

    @property
    def qa(self) -> Path:
        return self.root / ".qa"

    def work(self, batch: str) -> Path:
        return self.batch_dir / batch

    def manifest_path(self, batch: str) -> Path:
        return self.work(batch) / "batch.json"

    def rel(self, p: Path) -> str:
        """Display path, including the art-root folder name (e.g. art_inbox/.batch/x)."""
        try:
            return p.relative_to(self.root.parent).as_posix()
        except ValueError:
            return p.as_posix()

    def mrel(self, p: Path) -> str:
        """Manifest path: relative to the art root, the form stored in batch.json."""
        try:
            return p.relative_to(self.root).as_posix()
        except ValueError:
            return p.as_posix()


def write_text_lf(path: Path, text: str) -> None:
    """Write UTF-8 with LF endings on every platform.

    The hand-written reference PROMPT.md files are LF; letting Python's text mode
    translate to CRLF on Windows would make every regenerated file a whole-file diff.
    """
    path.write_bytes(text.encode("utf-8"))


def die(msg: str) -> "NoReturn":  # type: ignore[name-defined]
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(2)


def load_manifest(ctx: Ctx, batch: str) -> dict:
    path = ctx.manifest_path(batch)
    if not path.exists():
        die(f"no manifest at {ctx.rel(path)} - run `art.py init {batch} --layout <png>` first")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        die(f"{ctx.rel(path)} is not valid JSON: {exc}")
    data.setdefault("batch", batch)
    return data


def save_manifest(ctx: Ctx, batch: str, data: dict) -> Path:
    path = ctx.manifest_path(batch)
    path.parent.mkdir(parents=True, exist_ok=True)
    write_text_lf(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return path


def sheet_assets(sheet: dict) -> list[str]:
    return list(sheet.get("assets") or [])


def sheet_cells(sheet: dict) -> list[str]:
    """Flatten the row descriptions into one cell list, reading order."""
    cells: list[str] = []
    for row in sheet.get("rows") or []:
        cells.extend(row)
    return cells


def validate(ctx: Ctx, data: dict) -> list[str]:
    """Return a list of problems; empty means the manifest is internally consistent."""
    problems: list[str] = []
    batch = data.get("batch", "?")
    if not data.get("sheets"):
        problems.append("manifest has no sheets")
    styles = data.get("style_refs") or {}

    seen_ids: set[str] = set()
    seen_assets: dict[str, str] = {}
    for sheet in data.get("sheets") or []:
        sid = sheet.get("id")
        if not sid:
            problems.append("a sheet has no id")
            continue
        if sid in seen_ids:
            problems.append(f"sheet id {sid!r} used twice")
        seen_ids.add(sid)

        mode = sheet.get("mode", "sheet")
        if mode not in ("sheet", "single", "edit"):
            problems.append(f"{sid}: unknown mode {mode!r} (sheet|single|edit)")

        assets = sheet_assets(sheet)
        if not assets:
            problems.append(f"{sid}: no assets listed")
        for name in assets:
            if not ASSET_RE.match(name):
                problems.append(f"{sid}: asset name {name!r} is not lower_snake_case")
            if name in seen_assets and seen_assets[name] != sid:
                problems.append(
                    f"{sid}: asset {name!r} is also produced by sheet {seen_assets[name]} "
                    "- one asset, one sheet"
                )
            seen_assets.setdefault(name, sid)

        if mode == "sheet":
            grid = sheet.get("grid")
            if not (isinstance(grid, list) and len(grid) == 2):
                problems.append(f"{sid}: grid must be [rows, cols]")
            else:
                rows, cols = grid
                cells = sheet_cells(sheet)
                if len(cells) != rows * cols:
                    problems.append(
                        f"{sid}: grid {rows}x{cols} = {rows * cols} cells but "
                        f"{len(cells)} cell descriptions"
                    )
                if len(assets) != rows * cols:
                    problems.append(
                        f"{sid}: grid {rows}x{cols} = {rows * cols} cells but "
                        f"{len(assets)} assets"
                    )
                declared = sheet.get("rows") or []
                if len(declared) != rows:
                    problems.append(f"{sid}: grid says {rows} rows but {len(declared)} row(s) given")
        elif mode == "single":
            if len(assets) != 1:
                problems.append(f"{sid}: mode single must list exactly 1 asset")
            if not sheet.get("object"):
                problems.append(f"{sid}: mode single needs an \"object\" description")
        elif mode == "edit":
            if not sheet.get("instruction"):
                problems.append(f"{sid}: mode edit needs an \"instruction\"")
            if not sheet.get("source"):
                problems.append(f"{sid}: mode edit needs a \"source\" image to edit")

        if mode != "edit":
            kind = sheet.get("kind")
            if not kind:
                problems.append(f"{sid}: no kind (run `art.py kinds`)")
            elif kind not in ctx.profile["framing"] and not sheet.get("framing"):
                problems.append(
                    f"{sid}: unknown kind {kind!r} and no \"framing\" override - "
                    f"known kinds: {', '.join(sorted(ctx.profile['framing']))}"
                )
            trim = sheet.get("trim", "tight")
            if trim not in ("tight", "uniform", "none"):
                problems.append(f"{sid}: trim must be tight|uniform|none, got {trim!r}")

        if mode != "edit":
            style = sheet.get("style")
            if not style:
                problems.append(f"{sid}: no style ref key")
            elif style not in styles:
                problems.append(
                    f"{sid}: style {style!r} is not in style_refs "
                    f"({', '.join(sorted(styles)) or 'none declared'})"
                )

        for i, ref in enumerate(sheet.get("refs") or [], start=2):
            if ref.get("type") not in ("accepted", "shape"):
                problems.append(f"{sid} ref #{i}: type must be accepted|shape")
            if not ref.get("src"):
                problems.append(f"{sid} ref #{i}: no src")
            if not ref.get("subject"):
                problems.append(f"{sid} ref #{i}: no subject")
    if not problems:
        problems_src = _missing_sources(ctx, data)
        problems.extend(problems_src)
    _ = batch
    return problems


def _resolves(ctx: Ctx, src: str | None) -> bool:
    """A manifest path resolves only if it is non-empty and names an existing file.

    The empty string must be rejected explicitly: `root / ""` is the root folder
    itself, which exists, so a half-filled skeleton would otherwise sail through
    validation and only blow up later inside shutil.copyfile.
    """
    if not src:
        return False
    p = ctx.root / src
    return p.is_file()


def _missing_sources(ctx: Ctx, data: dict) -> list[str]:
    out: list[str] = []
    used_styles = {
        s.get("style") for s in (data.get("sheets") or []) if s.get("mode") != "edit"
    }
    for key, src in (data.get("style_refs") or {}).items():
        if key not in used_styles:
            continue  # a skeleton may list spare keys; only the used ones must exist
        if not _resolves(ctx, src):
            out.append(f"style_refs.{key}: not a file: {src or '(empty)'}")
    for sheet in data.get("sheets") or []:
        sid = sheet.get("id", "?")
        if sheet.get("mode") == "edit":
            src = sheet.get("source")
            if not _resolves(ctx, src):
                out.append(f"{sid}: edit source is not a file: {src or '(empty)'}")
        for i, ref in enumerate(sheet.get("refs") or [], start=2):
            src = ref.get("src")
            if not _resolves(ctx, src):
                out.append(f"{sid} ref #{i}: not a file: {src or '(empty)'}")
    return out


# --------------------------------------------------------------------------
# prep - stage attachments and render PROMPT.md
# --------------------------------------------------------------------------


def attachment_plan(data: dict, sheet: dict) -> list[tuple[str, str]]:
    """Return [(staged filename, source path relative to art root)] in prompt order."""
    sid = sheet["id"]
    plan: list[tuple[str, str]] = []
    if sheet.get("mode") == "edit":
        plan.append((f"{sid}_1_edit.png", sheet["source"]))
        return plan
    style_key = sheet.get("style")
    plan.append((f"1_style_{style_key}.png", (data.get("style_refs") or {})[style_key]))
    for i, ref in enumerate(sheet.get("refs") or [], start=2):
        plan.append((f"{sid}_{i}_hint.png", ref["src"]))
    return plan


def render_prompt(ctx: Ctx, data: dict, sheet: dict) -> str:
    """Build the copy-paste prompt body for one sheet."""
    p = ctx.profile
    mode = sheet.get("mode", "sheet")
    lines: list[str] = []

    if mode == "edit":
        lines.append(sheet["instruction"].strip())
        lines.append("")
        lines.append(p["negative_line"])
        return "\n".join(lines)

    # Reference block
    lines.append(p["style_line"].format(n=1))
    for i, ref in enumerate(sheet.get("refs") or [], start=2):
        tpl = p["accepted_line"] if ref["type"] == "accepted" else p["shape_line"]
        lines.append(tpl.format(n=i, subject=ref["subject"]))
    lines.append("")

    kind = sheet.get("kind", "item")
    framing = sheet.get("framing")
    if framing is None:
        framing = p["framing"].get(kind, "")

    if mode == "single":
        lines.append(p["single_opener"])
        obj = sheet["object"].strip()
        lines.append(f"The object: {obj}")
    else:
        rows, cols = sheet["grid"]
        cells = sheet_cells(sheet)
        lines.append(p["sheet_opener"].format(count=len(cells), rows=rows, cols=cols))
        for r, row in enumerate(sheet["rows"], start=1):
            parts = "; ".join(f"({c}) {desc}" for c, desc in enumerate(row, start=1))
            lines.append(f"Row {r}: {parts}.")

    # "extra" sits between the cell list and the framing clause (set-wide notes:
    # "All six are the same paper seed packet..."); "tail" sits after it
    # (per-row rules: "Each row is ONE plant in 4 growth stages...").
    for extra in sheet.get("extra") or []:
        lines.append(extra)
    if framing:
        lines.append(framing)
    for tail in sheet.get("tail") or []:
        lines.append(tail)
    lines.append("")

    full_bleed = ctx.is_full_bleed(kind)
    if mode == "sheet" and not full_bleed:
        lines.append(p["separation_line"])
    if not full_bleed:
        lines.append(
            p["background_line"].format(hex=p["sheet_bg"], name=p["sheet_bg_name"])
        )
    lines.append(p["negative_line"])
    return "\n".join(lines)


def render_prompt_md(ctx: Ctx, data: dict) -> str:
    batch = data["batch"]
    work_rel = f"{ctx.rel(ctx.work(batch))}/"
    out: list[str] = []
    title = data.get("title", "")
    out.append(f"# Batch {batch}" + (f" — {title}" if title else ""))
    out.append("")
    out.append(GENERATED_BY.format(batch=batch, manifest=f"{work_rel}batch.json"))
    out.append("")
    out.append(f"Thư mục làm việc: `{work_rel}` (file đính kèm nằm sẵn ở đó).")
    out.append("")
    out.append(HOWTO)
    if data.get("note"):
        out.append("")
        out.append(data["note"])
    out.append("")

    for sheet in data["sheets"]:
        sid = sheet["id"]
        mode = sheet.get("mode", "sheet")
        heading = f"## Sheet {sid}"
        if sheet.get("title"):
            heading += f" — {sheet['title']}"
        if mode == "edit":
            heading += " (sửa từ ảnh mẫu)"
        out.append(heading)
        out.append("")
        out.append(f"- Lưu thành: `{work_rel}{sid}.png`")

        plan = attachment_plan(data, sheet)
        if mode == "edit":
            out.append(f"- Đính kèm: `{plan[0][0]}` (ảnh cần sửa). {EDIT_NOTE}")
        else:
            names = ", ".join(f"`{n}`" for n, _ in plan)
            out.append(f"- Đính kèm (theo thứ tự): {names}")

        assets = sheet_assets(sheet)
        if mode == "sheet":
            rows, cols = sheet["grid"]
            out.append(f"- Kết quả: lưới {rows}×{cols}: " + ", ".join(assets))
        else:
            out.append("- Kết quả: " + ", ".join(assets))
        out.append("")
        out.append("```text")
        out.append(render_prompt(ctx, data, sheet))
        out.append("```")
        out.append("")
    return "\n".join(out)


def cmd_prep(ctx: Ctx, args) -> int:
    data = load_manifest(ctx, args.batch)
    problems = validate(ctx, data)
    if problems:
        print(f"Manifest {ctx.rel(ctx.manifest_path(args.batch))} has {len(problems)} problem(s):")
        for p in problems:
            print(f"  - {p}")
        return 1

    work = ctx.work(args.batch)
    work.mkdir(parents=True, exist_ok=True)
    staged = 0
    for sheet in data["sheets"]:
        for name, src in attachment_plan(data, sheet):
            dst = work / name
            source = ctx.root / src
            if dst.resolve() == source.resolve():
                continue
            shutil.copyfile(source, dst)
            staged += 1

    md = work / "PROMPT.md"
    write_text_lf(md, render_prompt_md(ctx, data))
    print(f"OK  {ctx.rel(md)}")
    print(f"    {len(data['sheets'])} sheet(s), {staged} attachment(s) staged into {ctx.rel(work)}/")
    total = sum(len(sheet_assets(s)) for s in data["sheets"])
    print(f"    {total} asset(s) promised")
    return 0


# --------------------------------------------------------------------------
# hint - crop a region out of a layout
# --------------------------------------------------------------------------


def parse_box(text: str) -> tuple[int, int, int, int]:
    parts = [p.strip() for p in text.replace(" ", ",").split(",") if p.strip()]
    if len(parts) != 4:
        die(f"--box wants x,y,w,h - got {text!r}")
    try:
        x, y, w, h = (int(p) for p in parts)
    except ValueError:
        die(f"--box values must be integers - got {text!r}")
    if w <= 0 or h <= 0:
        die("--box width and height must be positive")
    return x, y, w, h


def cmd_hint(ctx: Ctx, args) -> int:
    data = load_manifest(ctx, args.batch)
    source_rel = args.source or data.get("layout")
    if not source_rel:
        die("no --source and the manifest has no \"layout\"")
    src = ctx.root / source_rel
    if not src.exists():
        die(f"source image not found: {ctx.rel(src)}")

    img = Image.open(src).convert("RGBA")
    x, y, w, h = parse_box(args.box)
    pad = args.pad
    left, top = max(0, x - pad), max(0, y - pad)
    right, bottom = min(img.width, x + w + pad), min(img.height, y + h + pad)
    if left >= right or top >= bottom:
        die("the box falls outside the image")
    crop = img.crop((left, top, right, bottom))

    role = args.role
    name = f"{args.sheet}_{args.index}_{role}.png"
    # One folder per batch: sheet ids are only unique inside a batch, so a flat
    # .hints/ would have batch B's sheet A overwrite batch A's sheet A.
    out_dir = ctx.root / (args.out or f".hints/{args.batch}")
    out_dir.mkdir(parents=True, exist_ok=True)
    dst = out_dir / name
    crop.save(dst)
    print(f"OK  {ctx.rel(dst)}  {crop.width}x{crop.height}  (from {ctx.rel(src)} at {x},{y})")
    print(f"    manifest src: \"{ctx.mrel(dst)}\"")
    return 0


# --------------------------------------------------------------------------
# cut - split a sheet into per-asset candidates
# --------------------------------------------------------------------------


def content_mask(rgb: np.ndarray, bg: tuple[int, int, int], tol: int) -> np.ndarray:
    """True where the pixel is NOT the flat sheet background."""
    diff = np.abs(rgb.astype(np.int16) - np.array(bg, dtype=np.int16)).max(axis=2)
    return diff > tol


def split_bands(profile: np.ndarray, min_gap: int, min_size: int) -> list[tuple[int, int]]:
    """Split a 1-D boolean occupancy profile into [start, end) content bands.

    Gaps shorter than `min_gap` do not split a band (they are detail inside one
    object); bands shorter than `min_size` are dropped as speckle.
    """
    # 1. raw runs of occupied indices
    runs: list[list[int]] = []
    start = None
    for i, filled in enumerate(profile):
        if filled and start is None:
            start = i
        elif not filled and start is not None:
            runs.append([start, i])
            start = None
    if start is not None:
        runs.append([start, len(profile)])

    # 2. merge runs separated by a gap too small to be a real cell boundary
    merged: list[list[int]] = []
    for run in runs:
        if merged and run[0] - merged[-1][1] < min_gap:
            merged[-1][1] = run[1]
        else:
            merged.append(run)

    # 3. drop speckle
    return [(a, b) for a, b in merged if b - a >= min_size]


def detect_cells(mask: np.ndarray, rows: int, cols: int) -> tuple[list[tuple[int, int, int, int]], list[str]]:
    """Find cell boxes in reading order. Falls back to an even grid on mismatch."""
    notes: list[str] = []
    h, w = mask.shape
    min_gap_y = max(4, h // 60)
    min_gap_x = max(4, w // 60)
    min_size_y = max(8, h // 40)
    min_size_x = max(8, w // 40)

    row_bands = split_bands(mask.any(axis=1), min_gap_y, min_size_y)
    boxes: list[tuple[int, int, int, int]] = []
    ok = len(row_bands) == rows
    if not ok:
        notes.append(f"found {len(row_bands)} row band(s), manifest says {rows}")
    else:
        for top, bottom in row_bands:
            strip = mask[top:bottom, :]
            col_bands = split_bands(strip.any(axis=0), min_gap_x, min_size_x)
            if len(col_bands) != cols:
                notes.append(
                    f"row at y={top}..{bottom}: found {len(col_bands)} column band(s), "
                    f"manifest says {cols}"
                )
                ok = False
                break
            for left, right in col_bands:
                boxes.append((left, top, right, bottom))
    if not ok:
        boxes = []
        for r in range(rows):
            for c in range(cols):
                boxes.append(
                    (c * w // cols, r * h // rows, (c + 1) * w // cols, (r + 1) * h // rows)
                )
        notes.append("fell back to an even grid - check the candidates by eye")
    return boxes, notes


def flood_background(rgb: np.ndarray, bg: tuple[int, int, int], tol: int) -> np.ndarray:
    """True where the pixel is background reachable from the border.

    Flood fill rather than a global threshold, so a grey area *inside* an object
    (a stone, a shadow tone) is not punched out.
    """
    near = np.abs(rgb.astype(np.int16) - np.array(bg, dtype=np.int16)).max(axis=2) <= tol
    seed = np.zeros_like(near)
    seed[0, :] |= near[0, :]
    seed[-1, :] |= near[-1, :]
    seed[:, 0] |= near[:, 0]
    seed[:, -1] |= near[:, -1]
    while True:
        grown = seed.copy()
        for _ in range(8):  # several dilations per convergence test keeps this fast
            g = grown.copy()
            g[1:, :] |= grown[:-1, :]
            g[:-1, :] |= grown[1:, :]
            g[:, 1:] |= grown[:, :-1]
            g[:, :-1] |= grown[:, 1:]
            grown = g & near
        if np.array_equal(grown, seed):
            return seed
        seed = grown


def cut_cell(
    sheet_rgba: np.ndarray, box: tuple[int, int, int, int],
    bg: tuple[int, int, int], tol: int,
) -> Image.Image | None:
    left, top, right, bottom = box
    sub = sheet_rgba[top:bottom, left:right]
    if sub.size == 0:
        return None
    is_bg = flood_background(sub[..., :3], bg, tol)
    alpha = np.where(is_bg, 0, 255).astype(np.uint8)
    if not alpha.any():
        return None
    ys, xs = np.nonzero(alpha)
    y0, y1 = ys.min(), ys.max() + 1
    x0, x1 = xs.min(), xs.max() + 1
    out = sub.copy()
    out[..., 3] = np.minimum(out[..., 3], alpha)
    return Image.fromarray(out[y0:y1, x0:x1], mode="RGBA")


def box_clipped(box: tuple[int, int, int, int], w: int, h: int) -> bool:
    """A content band that reaches the sheet border ran out of canvas.

    The boxes from detect_cells are already tight around the ink, so "touches its
    own box" is true by construction and means nothing. What does mean something
    is ink reaching the edge of the *sheet*: Gemini drew past the canvas and the
    sprite is cut off, which is the one defect the cut step can see on its own.
    """
    left, top, right, bottom = box
    return left <= 0 or top <= 0 or right >= w or bottom >= h


def pad_uniform(images: list[Image.Image], anchor: str = "bottom-center") -> list[Image.Image]:
    """Pad every sprite onto one common canvas so a sequence shares a baseline.

    A growth sequence (sprout -> grow -> ripe -> wilt) is swapped frame by frame in
    the game; trimmed to its own ink each frame would jump around. Padding to the
    widest/tallest and anchoring at the same point keeps the plant rooted.
    """
    if not images:
        return images
    w = max(im.width for im in images)
    h = max(im.height for im in images)
    out: list[Image.Image] = []
    for im in images:
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        if anchor == "center":
            pos = ((w - im.width) // 2, (h - im.height) // 2)
        elif anchor == "bottom-left":
            pos = (0, h - im.height)
        else:  # bottom-center
            pos = ((w - im.width) // 2, h - im.height)
        canvas.paste(im, pos)
        out.append(canvas)
    return out


def cmd_cut(ctx: Ctx, args) -> int:
    data = load_manifest(ctx, args.batch)
    work = ctx.work(args.batch)
    ctx.candidates.mkdir(parents=True, exist_ok=True)

    wanted = set(args.sheet) if args.sheet else None
    any_done = False
    exit_code = 0

    for sheet in data["sheets"]:
        sid = sheet["id"]
        if wanted and sid not in wanted:
            continue
        src = work / f"{sid}.png"
        if not src.exists():
            print(f"--  {sid}: no {ctx.rel(src)} yet (not generated)")
            continue
        any_done = True
        assets = sheet_assets(sheet)
        img = Image.open(src).convert("RGBA")
        arr = np.array(img)
        mode = sheet.get("mode", "sheet")
        kind = sheet.get("kind", "item")

        if mode != "sheet" or ctx.is_full_bleed(kind):
            # Full-bleed scene or a single object: store as-is, no grid, no cut.
            name = assets[0]
            dst = ctx.candidates / f"{name}_{args.variant}.png"
            if dst.exists() and not args.force:
                print(f"--  {sid}: {ctx.rel(dst)} exists (use --force)")
                continue
            if ctx.is_full_bleed(kind) or mode == "edit" or sheet.get("trim") == "none":
                img.save(dst)
            else:
                cut = cut_cell(arr, (0, 0, img.width, img.height), ctx.bg_rgb, ctx.bg_tol)
                (cut or img).save(dst)
            print(f"OK  {sid}: {ctx.rel(dst)}")
            continue

        rows, cols = sheet["grid"]
        mask = content_mask(arr[..., :3], ctx.bg_rgb, ctx.bg_tol)
        boxes, notes = detect_cells(mask, rows, cols)
        for n in notes:
            print(f"!!  {sid}: {n}")
            exit_code = 1

        cuts: list[Image.Image | None] = []
        for box in boxes:
            cuts.append(cut_cell(arr, box, ctx.bg_rgb, ctx.bg_tol))
        if sheet.get("trim", "tight") == "uniform":
            good = [c for c in cuts if c is not None]
            padded = pad_uniform(good, sheet.get("anchor", "bottom-center"))
            it = iter(padded)
            cuts = [next(it) if c is not None else None for c in cuts]

        for name, box, cut in zip(assets, boxes, cuts):
            dst = ctx.candidates / f"{name}_{args.variant}.png"
            if dst.exists() and not args.force:
                print(f"--  {sid}/{name}: exists (use --force)")
                continue
            if cut is None:
                print(f"!!  {sid}/{name}: cell is empty")
                exit_code = 1
                continue
            cut.save(dst)
            flag = "  <- ink reaches the sheet edge, may be clipped" if box_clipped(
                box, img.width, img.height) else ""
            print(f"OK  {sid}/{name}: {ctx.rel(dst)}  {cut.width}x{cut.height}{flag}")
            if flag:
                exit_code = 1
    if not any_done:
        print("Nothing to cut - no generated sheet found in", ctx.rel(work))
    return exit_code


# --------------------------------------------------------------------------
# check / status / approve
# --------------------------------------------------------------------------


def inspect_candidate(path: Path, full_bleed: bool, uniform: bool = False) -> list[str]:
    """Cheap pixel sanity on one cut candidate. Says nothing about art direction.

    `uniform` sheets are padded to a shared canvas on purpose, so "mostly
    transparent" and "wide empty margin" are the intended result for the small
    frames of a sequence, not defects - those two checks are skipped there.
    """
    notes: list[str] = []
    try:
        img = Image.open(path).convert("RGBA")
    except Exception as exc:  # noqa: BLE001 - a corrupt download is exactly what we look for
        return [f"cannot be opened ({exc})"]
    arr = np.array(img)
    w, h = img.size
    if w < 24 or h < 24:
        notes.append(f"tiny ({w}x{h}) - the cell was probably near-empty")
    transparent = float((arr[..., 3] < 16).mean())
    if full_bleed:
        if transparent > 0.02:
            notes.append(f"{transparent:.0%} transparent - a background should be opaque")
    else:
        if transparent < 0.02:
            notes.append("no transparency - the background was not removed")
        elif transparent > 0.92 and not uniform:
            notes.append(f"{transparent:.0%} transparent - almost nothing was kept")
    # A sprite trimmed to its ink should touch all four sides of its own canvas;
    # a wide empty margin means the alpha mask caught stray background speckle.
    opaque = arr[..., 3] >= 16
    if opaque.any() and not full_bleed and not uniform:
        ys, xs = np.nonzero(opaque)
        margin = min(int(ys.min()), int(xs.min()), h - 1 - int(ys.max()), w - 1 - int(xs.max()))
        if margin > max(8, min(w, h) * 0.08):
            notes.append(f"{margin}px empty margin - speckle may have widened the trim")
    return notes


def cmd_check(ctx: Ctx, args) -> int:
    data = load_manifest(ctx, args.batch)
    problems = validate(ctx, data)
    for p in problems:
        print(f"MANIFEST  {p}")

    work = ctx.work(args.batch)
    missing_sheets: list[str] = []
    missing_cands: list[str] = []
    approved = 0
    total = 0

    prefixes = tuple(ctx.profile["prefixes"])
    pixel_notes: list[str] = []
    odd_names: list[str] = []

    for sheet in data["sheets"]:
        sid = sheet["id"]
        if not (work / f"{sid}.png").exists():
            missing_sheets.append(sid)
        full_bleed = ctx.is_full_bleed(sheet.get("kind", "item")) or sheet.get("trim") == "none"
        uniform = sheet.get("trim") == "uniform"
        for name in sheet_assets(sheet):
            total += 1
            if prefixes and not name.startswith(prefixes):
                odd_names.append(f"{sid}/{name}")
            cands = sorted(ctx.candidates.glob(f"{name}_?.png"))
            if not cands:
                missing_cands.append(f"{sid}/{name}")
            for cand in cands:
                for note in inspect_candidate(cand, full_bleed, uniform):
                    pixel_notes.append(f"{cand.name}: {note}")
            if (ctx.root / f"{name}.png").exists():
                approved += 1

    print()
    print(f"Batch {args.batch}: {total} asset(s) promised")
    print(f"  sheets generated : {len(data['sheets']) - len(missing_sheets)}/{len(data['sheets'])}"
          + (f"   missing: {', '.join(missing_sheets)}" if missing_sheets else ""))
    print(f"  candidates cut   : {total - len(missing_cands)}/{total}")
    for m in missing_cands:
        print(f"      missing candidate: {m}")
    print(f"  approved         : {approved}/{total}")
    if odd_names:
        print(f"  unknown prefix   : {len(odd_names)}")
        for n in odd_names:
            print(f"      {n}")
    if pixel_notes:
        print(f"  pixel warnings   : {len(pixel_notes)}")
        for n in pixel_notes:
            print(f"      {n}")
    print("  (pixel checks are mechanical - style and likeness still need your eyes)")
    return 1 if (problems or missing_sheets or missing_cands or pixel_notes) else 0


def cmd_status(ctx: Ctx, args) -> int:
    batches = sorted(p.name for p in ctx.batch_dir.glob("*") if (p / "batch.json").exists())
    loose = sorted(
        p.name for p in ctx.batch_dir.glob("*")
        if p.is_dir() and not (p / "batch.json").exists()
    )
    if not batches and not loose:
        print(f"No batches under {ctx.rel(ctx.batch_dir)}/")
        return 0
    print(f"{'batch':<24} {'sheets':>8} {'cut':>9} {'approved':>9}")
    print("-" * 54)
    for b in batches:
        data = load_manifest(ctx, b)
        sheets = data.get("sheets") or []
        made = sum(1 for s in sheets if (ctx.work(b) / f"{s['id']}.png").exists())
        names = [n for s in sheets for n in sheet_assets(s)]
        cut = sum(1 for n in names if any(ctx.candidates.glob(f"{n}_?.png")))
        ok = sum(1 for n in names if (ctx.root / f"{n}.png").exists())
        print(f"{b:<24} {made:>3}/{len(sheets):<4} {cut:>4}/{len(names):<4} {ok:>4}/{len(names):<4}")
    for b in loose:
        print(f"{b:<24} {'-':>8} {'-':>9} {'-':>9}  (no batch.json - hand-written)")
    return 0


def cmd_approve(ctx: Ctx, args) -> int:
    rc = 0
    for name in args.asset:
        src = ctx.candidates / f"{name}_{args.variant}.png"
        if not src.exists():
            print(f"!!  {name}: no candidate {ctx.rel(src)}")
            rc = 1
            continue
        dst = ctx.root / f"{name}.png"
        if dst.exists() and not args.force:
            print(f"--  {name}: {ctx.rel(dst)} already approved (use --force)")
            continue
        shutil.copyfile(src, dst)
        print(f"OK  {name}: {ctx.rel(src)} -> {ctx.rel(dst)}")
    return rc


# --------------------------------------------------------------------------
# profile / ruler / kinds - the commands that make a new project cheap
# --------------------------------------------------------------------------


def cmd_profile(ctx: Ctx, args) -> int:
    path = ctx.root / PROFILE_FILE
    if args.init:
        if path.exists() and not args.force:
            die(f"{ctx.rel(path)} already exists (use --force)")
        write_text_lf(path, json.dumps(DEFAULT_PROFILE, ensure_ascii=False, indent=2) + "\n")
        print(f"OK  {ctx.rel(path)}")
        print("    edit it to match this project's art style; every key is optional,")
        print("    anything you delete falls back to the built-in default.")
        return 0
    where = ctx.rel(path) if path.exists() else "(built-in defaults, no profile.json)"
    print(f"Active profile: {where}")
    print(f"  sheet_bg        {ctx.profile['sheet_bg']} \"{ctx.profile['sheet_bg_name']}\"  "
          f"tolerance {ctx.profile['bg_tolerance']}")
    print(f"  full_bleed      {', '.join(ctx.profile['full_bleed_kinds'])}")
    print(f"  kinds           {', '.join(sorted(ctx.profile['framing']))}")
    print(f"  prefixes        {', '.join(ctx.profile['prefixes']) or '(not checked)'}")
    print()
    print("  style_line:")
    print(f"    {ctx.profile['style_line'].format(n=1)}")
    return 0


def cmd_kinds(ctx: Ctx, args) -> int:
    """List the framing clauses available to a sheet's "kind"."""
    full = set(ctx.profile["full_bleed_kinds"])
    for name in sorted(ctx.profile["framing"]):
        tag = "  [full-bleed, never cut]" if name in full else ""
        print(f"{name}{tag}")
        print(f"    {ctx.profile['framing'][name]}")
        print()
    return 0


def cmd_ruler(ctx: Ctx, args) -> int:
    """Write a copy of an image with a labelled coordinate grid drawn over it.

    Picking `hint --box X,Y,W,H` out of an arbitrary layout by guessing is the
    one step with no feedback loop. This gives one: open the ruler, read the
    numbers off the gridlines, crop, look at the crop.
    """
    from PIL import ImageDraw

    src = Path(args.image)
    if not src.is_absolute():
        cand = ctx.root / args.image
        src = cand if cand.exists() else src
    if not src.exists():
        die(f"image not found: {args.image}")

    img = Image.open(src).convert("RGB")
    step = args.step or max(50, round(max(img.width, img.height) / 20 / 50) * 50)
    draw = ImageDraw.Draw(img, "RGBA")

    font = None
    for candidate in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            from PIL import ImageFont

            font = ImageFont.truetype(candidate, 18)
            break
        except Exception:  # noqa: BLE001 - any missing font just falls back
            continue

    def label(x: int, y: int, text: str) -> None:
        # White plate under the number: magenta on a pastel layout is unreadable.
        pad = 2
        box = draw.textbbox((x, y), text, font=font)
        draw.rectangle(
            (box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad), fill=(255, 255, 255, 230)
        )
        draw.text((x, y), text, fill=(200, 0, 160, 255), font=font)

    for x in range(0, img.width, step):
        major = (x // step) % 5 == 0
        draw.line([(x, 0), (x, img.height)], fill=(255, 0, 255, 190 if major else 70), width=1)
        if major:
            label(x + 3, 3, str(x))
    for y in range(0, img.height, step):
        major = (y // step) % 5 == 0
        draw.line([(0, y), (img.width, y)], fill=(255, 0, 255, 190 if major else 70), width=1)
        if major and y > 0:
            label(3, y + 3, str(y))

    out_dir = ctx.root / ".qa"
    out_dir.mkdir(parents=True, exist_ok=True)
    dst = out_dir / f"{src.stem}-ruler.png"
    img.save(dst)
    print(f"OK  {ctx.rel(dst)}  {img.width}x{img.height}, grid every {step}px "
          f"(labelled every {step * 5}px)")
    print(f"    read a box off it, then: art.py hint <batch> --sheet A --box X,Y,W,H")
    return 0


# --------------------------------------------------------------------------
# init
# --------------------------------------------------------------------------

SKELETON = {
    "batch": "",
    "title": "",
    "layout": "",
    "_help": [
        "Fill this in, then run: art.py prep <batch>",
        "style_refs: key -> an image in the target art style. Only keys a sheet uses must exist.",
        "kind: run `art.py kinds` to see the framing clauses this project defines.",
        "mode: sheet (a grid) | single (one object) | edit (clean up a screenshot).",
        "Delete this _help key when you are done.",
    ],
    "style_refs": {"<key>": "<path to a style reference, relative to the art root>"},
    "sheets": [
        {
            "id": "A",
            "title": "",
            "mode": "sheet",
            "kind": "<see: art.py kinds>",
            "style": "<key from style_refs>",
            "grid": [1, 2],
            "refs": [
                {
                    "type": "accepted",
                    "src": "<path, e.g. .hints/<batch>/A_2_hint.png>",
                    "subject": "the <thing the hint shows>",
                }
            ],
            "rows": [["<description of cell 1>", "<description of cell 2>"]],
            "extra": [],
            "assets": ["<asset_name_one>", "<asset_name_two>"],
        }
    ],
}


def cmd_init(ctx: Ctx, args) -> int:
    path = ctx.manifest_path(args.batch)
    if path.exists() and not args.force:
        die(f"{ctx.rel(path)} already exists (use --force)")
    data = json.loads(json.dumps(SKELETON))
    data["batch"] = args.batch
    data["title"] = args.title or ""
    work = ctx.work(args.batch)
    work.mkdir(parents=True, exist_ok=True)
    if args.layout:
        src = Path(args.layout)
        if not src.is_absolute():
            cand = ctx.root / args.layout
            src = cand if cand.exists() else src
        if not src.exists():
            die(f"layout not found: {args.layout}")
        dst = ctx.root / ".ref" / f"{args.batch}-layout{src.suffix.lower()}"
        dst.parent.mkdir(parents=True, exist_ok=True)
        if src.resolve() != dst.resolve():
            shutil.copyfile(src, dst)
        data["layout"] = ctx.mrel(dst)
        with Image.open(dst) as im:
            print(f"    layout {ctx.rel(dst)}  {im.width}x{im.height}")
    save_manifest(ctx, args.batch, data)
    print(f"OK  {ctx.rel(path)}")
    print("    fill in style_refs + sheets, then run: art.py prep " + args.batch)
    return 0


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="art.py", description=__doc__.split("\n")[0])
    p.add_argument("--root", default="art_inbox", help="art root (default: art_inbox)")
    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("init", help="scaffold a batch manifest")
    sp.add_argument("batch")
    sp.add_argument("--layout", help="the target layout image")
    sp.add_argument("--title", default="")
    sp.add_argument("--force", action="store_true")
    sp.set_defaults(fn=cmd_init)

    sp = sub.add_parser("hint", help="crop a hint out of the layout")
    sp.add_argument("batch")
    sp.add_argument("--sheet", required=True, help="sheet id the hint belongs to")
    sp.add_argument("--index", type=int, default=2, help="attachment position (2, 3, 4...)")
    sp.add_argument("--box", required=True, metavar="X,Y,W,H")
    sp.add_argument("--source", help="image to crop from (default: the manifest layout)")
    sp.add_argument("--role", default="hint", choices=["hint", "edit"])
    sp.add_argument("--pad", type=int, default=0)
    sp.add_argument("--out", help="folder under the art root (default: .hints)")
    sp.set_defaults(fn=cmd_hint)

    sp = sub.add_parser("prep", help="validate, stage attachments, write PROMPT.md")
    sp.add_argument("batch")
    sp.set_defaults(fn=cmd_prep)

    sp = sub.add_parser("cut", help="split generated sheets into candidates")
    sp.add_argument("batch")
    sp.add_argument("--sheet", action="append", help="limit to this sheet id (repeatable)")
    sp.add_argument("--variant", default="a", help="candidate suffix letter (default: a)")
    sp.add_argument("--force", action="store_true")
    sp.set_defaults(fn=cmd_cut)

    sp = sub.add_parser("check", help="compare disk against the manifest")
    sp.add_argument("batch")
    sp.set_defaults(fn=cmd_check)

    sp = sub.add_parser("status", help="one row per batch")
    sp.set_defaults(fn=cmd_status)

    sp = sub.add_parser("profile", help="show or create the project's art profile")
    sp.add_argument("--init", action="store_true", help="write profile.json with the defaults")
    sp.add_argument("--force", action="store_true")
    sp.set_defaults(fn=cmd_profile)

    sp = sub.add_parser("kinds", help="list the framing clauses a sheet can pick")
    sp.set_defaults(fn=cmd_kinds)

    sp = sub.add_parser("ruler", help="write a coordinate-grid copy of an image")
    sp.add_argument("image", help="the layout to measure")
    sp.add_argument("--step", type=int, help="grid spacing in px (default: auto)")
    sp.set_defaults(fn=cmd_ruler)

    sp = sub.add_parser("approve", help="promote candidates to approved assets")
    sp.add_argument("asset", nargs="+")
    sp.add_argument("--variant", default="a")
    sp.add_argument("--force", action="store_true")
    sp.set_defaults(fn=cmd_approve)
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    root = Path(args.root)
    if not root.is_absolute():
        root = Path.cwd() / root
    if not root.exists():
        die(f"art root not found: {root}")
    return args.fn(Ctx(root=root, profile=load_profile(root)), args)


if __name__ == "__main__":
    raise SystemExit(main())
