# Reading a layout into a manifest

This is the judgment half of the skill. The scripts cannot do it: deciding what is a
separate asset and what is scenery is a game-design call, and getting it wrong costs a
whole regeneration round.

Work from the **largest crop you can actually read**. Open the layout, then crop
section by section and read the crops — a 1800px-wide mockup downscaled into one view
loses every small icon.

## 1. Classify every visible thing

Four buckets. Everything in the picture lands in exactly one.

| Bucket | Test | Goes where |
|---|---|---|
| **Background** | It never moves, nothing is ever placed on top of *it* specifically, and the player cannot interact with it | stays painted into `bg_*` |
| **Independent asset** | The game places it, moves it, swaps it, hides it, or the player clicks it | its own sprite |
| **Already exists** | An equivalent sprite is in `art_inbox/` or `.candidates/` | reused, not regenerated |
| **Text / UI chrome** | Labels, numbers, HUD bars, buttons with writing on them | the *plate* is an asset, the **text is never drawn** |

The hard line is background vs. asset, and the question that settles it is: **does the
game ever need this thing without the rest of the picture?** A fence that is only ever
scenery stays in the background. The same fence, if a building can be placed where it
stands, becomes a sprite and the background keeps an empty grassy spot.

Sky, distant islands, paths, the ground, water, decorative foliage far from the play
area: background. Buildings, plots, characters, pickups, signs, every HUD icon: assets.

## 2. Decide what the background must *lose*

If the layout is a screenshot of a working screen (or someone else's game), the
background sheet is an **edit**, not a fresh drawing. Write the instruction as two
explicit lists:

- **REMOVE completely and paint X in their place** — every UI element named one by one,
  all text, every sign, every object that became a sprite in step 1. Name them; "remove
  the UI" is not specific enough and leaves half the bar behind.
- **KEEP** — the sky, the terrain, the paths, the shapes the sprites will sit on.

Where a removed object stood, say what replaces it ("keep them as empty grassy spots
ready for a building"). Otherwise the model leaves a hole or invents something new
there, and the sprite you place later will not line up.

## 3. Name the assets

`lower_snake_case`, prefix by role. `art.py profile` prints the prefixes this project
recognises and `check` flags names outside them; a different game sets its own list in
`profile.json`. The ones in use here:

| Prefix | Meaning |
|---|---|
| `bg_` | full-bleed scene background |
| `bld_` | a building the player interacts with |
| `plot_` | a plantable / buildable slot |
| `prop_` | scenery sprite, signpost, NPC, mascot |
| `crop_` / `flower_` / `fish_` | content sets, usually in stage or species sequences |
| `ui_item_` | inventory icon |
| `ui_hud_`, `ui_btn_`, `ui_icon_`, `ui_area_`, `ui_badge_`, `ui_avatar_` | interface |

A stage sequence suffixes the stage: `_sprout`, `_grow`, `_ripe`, `_wilt`. Those four
belong on one sheet, one row, and that sheet gets `"trim": "uniform"` so the frames
share a baseline.

Before you commit a name, grep for it. A name that already exists is a reuse decision,
not a collision to rename around.

## 4. Write the cell descriptions

One sentence per cell, in the prompt's own voice — concrete nouns, concrete colours, no
game jargon the model has never seen.

- **Say the silhouette first, the decoration second.** "a round dark-iron cauldron on
  three short legs" lands; "the alchemy station" does not.
- **Name colours in plain words** ("pale silvery blue and moonlight cream"), not hex.
- **Say what must NOT be there** when the layout shows it attached: "without any signs,
  text, trees or other objects around them".
- **Never ask for text.** Every plate, banner and button is drawn blank; the game draws
  the label. The standard negative line already forbids it, and the per-cell wording
  should say "empty smooth area for text" rather than naming the words.
- **Cross-reference the hints by number** — "the little round white cloud bird from
  image 2" — so the model knows which attachment governs which cell.

## 5. Choose the hints

Two kinds, and the difference matters because they get opposite instructions:

- **`accepted`** — this is what the thing should look like; match shape, colours and
  shading closely. Use a crop of art that is already approved, or of the layout itself
  when the layout is in the target style.
- **`shape`** — only the silhouette is right; the style is wrong and must be ignored.
  Use when the reference came from somewhere else (a stock illustration, another game).

Crop with `art.py hint`, which crops and nothing else. **Do not rescale.** A hint
squashed to a square teaches the model the wrong proportions, and proportion is most of
what a shape hint is for.

One hint per subject. Four attachments on a sheet (style + three hints) is the practical
ceiling before the model starts blending them.

## 6. Sanity pass before `prep`

- Every asset in the manifest appears in the layout, or is something the layout implies
  the game needs (an empty-state plot, a hover variant).
- No asset name appears twice in the batch.
- Nothing in the manifest already exists in `art_inbox/`.
- Every `refs.src` points at a file that exists — `prep` enforces this, but finding out
  now is cheaper.
- The background's REMOVE list covers every asset you just created a sheet for. An
  object left in the background *and* generated as a sprite will be drawn twice on screen.
