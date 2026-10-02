# Resolve the specification

Goal: one unambiguous resolution before any image work. Output shape (keep it in the brief header):

```yaml
asset_id:            # manifest id, snake_case
asset_name:          # nameVi
category:            # pig_skin | pig_sleep | fx | prop | building | env | ui | app_icon
rarity / collection:
primary_spec:        # file:line
secondary_specs:     # file:line list
constraints:         # standard sections
required_views:      # pigs: [side_right] — always (standard §2)
required_states:     # [idle] or [idle, sleep]; trough [empty, half, full]; fx_zzz 3 frames
required_accessories:# worn items from the concept; "nothing held"
technical_requirements: # canvas, alpha, ground line, output stems, final paths
manifest:            # row exists (status) | MISSING (+ proposed row)
reference_set:       # anchor + cells + compare pigs
```

## Pigs

1. `node .claude/skills/image-to-asset/scripts/resolve.mjs "<query>"` — accepts `#NN`, `pig_id`, `id` without
   prefix, Vietnamese name (accents optional) or a keyword. `--list [filter]` shows the numbering.
2. `AMBIGUOUS` → pick the exact-id hit if one exists; otherwise ask the user with the listed candidates
   (the only question allowed at this step).
3. `NOT_IN_CATALOGUE` → not a catalogue pig. If the user insists on a new concept, it needs a catalogue row
   first (product decision) → BLOCKED.
4. `pack_concept: null` → expand the catalogue one-liner into MUST-HAVEs (spec-map §2.4). If the one-liner names
   held props ("briefcase", "guitar", "magic staff"), turn each into a **worn** equivalent or drop it and note
   it as a future `acc_prop_*` (standard §6.2).

## Other families

Grep the id in the primary spec of [../references/spec-map.md](../references/spec-map.md) §1, read that table row
and the matching pack row (`grep -n "<id>" asset/AI_ASSET_GENERATION_PACK.md`). Sizes for props/buildings:
`grep -n "<id>" asset/building/ENVIRONMENT_CATALOGUE.md scripts/assets/sizes.ts`. Manifest row:
`node -e "const m=require('./public/assets/manifest/assets.json');for(const s in m)if(Array.isArray(m[s]))for(const r of m[s])if(r.id==='<id>')console.log(s,JSON.stringify(r))"`.

## Stop conditions

- Missing size/format that no doc gives and no sibling asset implies → BLOCKED (`NEED: kích thước`).
- Two specs contradict and spec-map §3 has no decision → BLOCKED with both quotes (file:line).
- Everything else (style details, small costume choices, colours within the palette) → decide, note it in the
  brief's `DECISIONS` line, continue.
