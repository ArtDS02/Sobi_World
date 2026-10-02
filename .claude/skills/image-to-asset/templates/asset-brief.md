# Brief — {asset_id} ({asset_name})

<!-- Save as art_inbox/.briefs/{asset_id}.md. ≤ 40 lines. Cite sections, don't paste specs. -->

```yaml
{resolution from resolve.mjs / workflows/resolve-spec.md — trimmed}
```

ASSET: {category}, {rarity}, states {idle[, sleep]}, backend {R|X|K}

MUST HAVE: {3–6 worn/visible items from the pack concept or expanded catalogue one-liner}
MUST NOT: nothing held · no scene/ground/shadow · no text · {concept-specific traps, e.g. "no basket"}

VISUAL STYLE: GAME_ART_DIRECTION §1, §5 — {only what is special for this asset, e.g. "metal = 2 tones, no chrome"}
PROPORTION: GAME_ART_DIRECTION §2 — {deviation allowed by concept, e.g. "pig_fat: width up to 1.45×H"}
COLOR: identity {main colour}; accents {≤2}; body {pink / coat colour}
LIGHTING: top-left, 1 shadow + 1 highlight
REFERENCE CHARACTERISTICS: anchor pig_classic; cell {sheet cell or none}; compare {ids}
REQUIRED VIEWS: side_right (left = runtime flip)
TECHNICAL: {canvas}, PNG-32, feet y=420, stems {art_inbox/...}, final {public/assets/...}
NEGATIVE: AI pack §1.3 + frontal face, big head, flat vector, glossy, glow, particles
CHARACTER (category block, keep only the matching one):
- pig: costume integrated into the silhouette; ears/snout/eyes/4 legs/tail stay readable at 128 px
- sleep: same pig as accepted idle {path}; pose from pigs c5r2; eyes closed curves; legs tucked
- prop/building: three-quarter view, own grass patch + contact shadow; states share one master
- fx/ui: front-on, centred, readable at {64|44} px, no container
DECISIONS: {choices made where the spec is silent, one line each}

## Prompt (backend X only)
{assembled per workflows/generation.md §X}
Attach: {ordered list}

## QA log
r1 …
