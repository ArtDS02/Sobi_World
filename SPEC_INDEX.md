# SPEC_INDEX

Đọc spec theo khoảng dòng: `sed -n 'start,endp' <file>`. Sinh tự động từ heading (bỏ qua code fence). Spec v4.1 / art standard v1.1 — sinh lại sau mỗi lần sửa spec.

## UN_IN_GAME_SPEC_v4_SOLO.md

| Chủ đề | File | Dòng |
|---|---|---|
| # UN IN HOMEMADE — SOLO EDITION | UN_IN_GAME_SPEC_v4_SOLO.md | 1-1 |
| ## Implementation Specification v4.1 — Desktop Edition | UN_IN_GAME_SPEC_v4_SOLO.md | 2-19 |
| # 0. IMPLEMENTATION CONTRACT | UN_IN_GAME_SPEC_v4_SOLO.md | 20-35 |
| # 1. WHY v4 EXISTS — the three problems in v3 | UN_IN_GAME_SPEC_v4_SOLO.md | 36-39 |
| ### 1.1 The player never had to play | UN_IN_GAME_SPEC_v4_SOLO.md | 40-47 |
| ### 1.2 There was nothing to spend gold on and nothing to aim at | UN_IN_GAME_SPEC_v4_SOLO.md | 48-53 |
| ### 1.3 The spec and the asset bible describe two different games | UN_IN_GAME_SPEC_v4_SOLO.md | 54-61 |
| # 2. DECISIONS REGISTER | UN_IN_GAME_SPEC_v4_SOLO.md | 62-96 |
| # 3. PRODUCT OVERVIEW | UN_IN_GAME_SPEC_v4_SOLO.md | 97-98 |
| ## 3.1 Core loop | UN_IN_GAME_SPEC_v4_SOLO.md | 99-115 |
| ## 3.2 Design priorities | UN_IN_GAME_SPEC_v4_SOLO.md | 116-124 |
| ## 3.3 Session shape the design targets | UN_IN_GAME_SPEC_v4_SOLO.md | 125-132 |
| # 4. TECHNOLOGY STACK | UN_IN_GAME_SPEC_v4_SOLO.md | 133-170 |
| ## 4.1 Directory structure | UN_IN_GAME_SPEC_v4_SOLO.md | 171-218 |
| # 5. DATA MODEL | UN_IN_GAME_SPEC_v4_SOLO.md | 219-222 |
| ## 5.1 Save document | UN_IN_GAME_SPEC_v4_SOLO.md | 223-265 |
| ## 5.2 Pig — breed and appearance are separate axes (D19) | UN_IN_GAME_SPEC_v4_SOLO.md | 266-294 |
| ## 5.3 Orders, transactions, breeding records | UN_IN_GAME_SPEC_v4_SOLO.md | 295-330 |
| ## 5.4 Derived values (never stored) | UN_IN_GAME_SPEC_v4_SOLO.md | 331-345 |
| ## 5.5 Invariants | UN_IN_GAME_SPEC_v4_SOLO.md | 346-351 |
| # 6. CONFIGURATION — single source of truth | UN_IN_GAME_SPEC_v4_SOLO.md | 352-355 |
| ## 6.1 Breeds | UN_IN_GAME_SPEC_v4_SOLO.md | 356-366 |
| ## 6.2 Derived per-breed care budgets (D16) | UN_IN_GAME_SPEC_v4_SOLO.md | 367-380 |
| ## 6.3 Items | UN_IN_GAME_SPEC_v4_SOLO.md | 381-387 |
| ## 6.4 Balance constants (TUNABLE) | UN_IN_GAME_SPEC_v4_SOLO.md | 388-458 |
| ## 6.5 Breeding matrix | UN_IN_GAME_SPEC_v4_SOLO.md | 459-498 |
| ## 6.6 Breed to artwork mapping — the bridge to the asset bible | UN_IN_GAME_SPEC_v4_SOLO.md | 499-532 |
| # 7. TIME SIMULATION ENGINE | UN_IN_GAME_SPEC_v4_SOLO.md | 533-536 |
| ## 7.1 When to advance | UN_IN_GAME_SPEC_v4_SOLO.md | 537-540 |
| ## 7.2 `advancePig` — piecewise, unchanged from v3 except for the rates | UN_IN_GAME_SPEC_v4_SOLO.md | 541-601 |
| ## 7.3 `resolveTrough` — auto-feeding, closed form (D17) | UN_IN_GAME_SPEC_v4_SOLO.md | 602-625 |
| ## 7.4 `advanceWorld` | UN_IN_GAME_SPEC_v4_SOLO.md | 626-641 |
| # 8. ACTIONS | UN_IN_GAME_SPEC_v4_SOLO.md | 642-664 |
| ## 8.0 Action feedback events (D25, v4.1) | UN_IN_GAME_SPEC_v4_SOLO.md | 665-685 |
| ## 8.1 `buyPig({ breed, gender })` | UN_IN_GAME_SPEC_v4_SOLO.md | 686-691 |
| ## 8.2 `feedPig({ pigId })` — manual fallback | UN_IN_GAME_SPEC_v4_SOLO.md | 692-696 |
| ## 8.3 `cleanPig({ pigId })` | UN_IN_GAME_SPEC_v4_SOLO.md | 697-700 |
| ## 8.4 `cleanAll()` — MVP quality of life, promoted from v3 backlog | UN_IN_GAME_SPEC_v4_SOLO.md | 701-704 |
| ## 8.5 `treatPig({ pigId })` | UN_IN_GAME_SPEC_v4_SOLO.md | 705-708 |
| ## 8.6 `fillTrough({ units })` | UN_IN_GAME_SPEC_v4_SOLO.md | 709-714 |
| ## 8.7 `sellPig({ pigId })` | UN_IN_GAME_SPEC_v4_SOLO.md | 715-720 |
| ## 8.8 `breedPigs({ pigAId, pigBId })` | UN_IN_GAME_SPEC_v4_SOLO.md | 721-733 |
| ## 8.9 Birth — automatic, inside `advanceWorld` | UN_IN_GAME_SPEC_v4_SOLO.md | 734-742 |
| ## 8.10 `buyItem({ itemId, quantity })` | UN_IN_GAME_SPEC_v4_SOLO.md | 743-745 |
| ## 8.11 `buySlot()` | UN_IN_GAME_SPEC_v4_SOLO.md | 746-750 |
| ## 8.12 `renamePig({ pigId, name })` | UN_IN_GAME_SPEC_v4_SOLO.md | 751-753 |
| ## 8.13 Skins — `buySkin({ skinId })` and `equipSkin({ pigId, skinId })` (D19) | UN_IN_GAME_SPEC_v4_SOLO.md | 754-758 |
| ## 8.14 Orders (D20) | UN_IN_GAME_SPEC_v4_SOLO.md | 759-789 |
| ## 8.15 Collection book | UN_IN_GAME_SPEC_v4_SOLO.md | 790-792 |
| ## 8.16 XP, level and gold | UN_IN_GAME_SPEC_v4_SOLO.md | 793-799 |
| # 9. PERSISTENCE | UN_IN_GAME_SPEC_v4_SOLO.md | 800-801 |
| ## 9.1 Save and load (D2) | UN_IN_GAME_SPEC_v4_SOLO.md | 802-818 |
| ## 9.2 Corruption and safety | UN_IN_GAME_SPEC_v4_SOLO.md | 819-824 |
| ## 9.3 Export and import | UN_IN_GAME_SPEC_v4_SOLO.md | 825-829 |
| ## 9.4 One running instance | UN_IN_GAME_SPEC_v4_SOLO.md | 830-834 |
| ## 9.5 Away summary | UN_IN_GAME_SPEC_v4_SOLO.md | 835-841 |
| # 10. UI / UX | UN_IN_GAME_SPEC_v4_SOLO.md | 842-843 |
| ## 10.1 Layout | UN_IN_GAME_SPEC_v4_SOLO.md | 844-861 |
| ## 10.2 Selected pig panel | UN_IN_GAME_SPEC_v4_SOLO.md | 862-878 |
| ## 10.3 First-run tutorial | UN_IN_GAME_SPEC_v4_SOLO.md | 879-881 |
| ## 10.4 Window and layout (v4.1: desktop) | UN_IN_GAME_SPEC_v4_SOLO.md | 882-887 |
| ## 10.5 i18n | UN_IN_GAME_SPEC_v4_SOLO.md | 888-892 |
| # 11. PHASER, SCENE AND PRESENTATION | UN_IN_GAME_SPEC_v4_SOLO.md | 893-917 |
| ## 11.1 Farm scene layout (v4.1) | UN_IN_GAME_SPEC_v4_SOLO.md | 918-933 |
| ## 11.2 Entity sync | UN_IN_GAME_SPEC_v4_SOLO.md | 934-937 |
| ## 11.3 Presentation event contract (D25) | UN_IN_GAME_SPEC_v4_SOLO.md | 938-962 |
| ## 11.4 Loading and missing assets | UN_IN_GAME_SPEC_v4_SOLO.md | 963-970 |
| # 12. AUDIO | UN_IN_GAME_SPEC_v4_SOLO.md | 971-993 |
| # 13. DESKTOP RUNTIME, PACKAGING AND OFFLINE (v4.1) | UN_IN_GAME_SPEC_v4_SOLO.md | 994-995 |
| ## 13.1 Process model | UN_IN_GAME_SPEC_v4_SOLO.md | 996-1001 |
| ## 13.2 Security and offline | UN_IN_GAME_SPEC_v4_SOLO.md | 1002-1006 |
| ## 13.3 Packaging and installation | UN_IN_GAME_SPEC_v4_SOLO.md | 1007-1012 |
| ## 13.4 Updates | UN_IN_GAME_SPEC_v4_SOLO.md | 1013-1015 |
| ## 13.5 Limitations to document in README | UN_IN_GAME_SPEC_v4_SOLO.md | 1016-1020 |
| # 14. TESTING | UN_IN_GAME_SPEC_v4_SOLO.md | 1021-1024 |
| ## 14.1 Engine golden values | UN_IN_GAME_SPEC_v4_SOLO.md | 1025-1042 |
| ## 14.2 Trough tests (new, and the most failure-prone area) | UN_IN_GAME_SPEC_v4_SOLO.md | 1043-1050 |
| ## 14.3 Action tests | UN_IN_GAME_SPEC_v4_SOLO.md | 1051-1053 |
| ## 14.4 Breeding tests | UN_IN_GAME_SPEC_v4_SOLO.md | 1054-1056 |
| ## 14.5 Orders and collection tests | UN_IN_GAME_SPEC_v4_SOLO.md | 1057-1059 |
| ## 14.6 Save tests | UN_IN_GAME_SPEC_v4_SOLO.md | 1060-1062 |
| ## 14.7 Economy simulation | UN_IN_GAME_SPEC_v4_SOLO.md | 1063-1065 |
| ## 14.8 Smoke test (Playwright + Electron) | UN_IN_GAME_SPEC_v4_SOLO.md | 1066-1068 |
| ## 14.9 Asset tests | UN_IN_GAME_SPEC_v4_SOLO.md | 1069-1073 |
| # 15. ACCEPTANCE CRITERIA | UN_IN_GAME_SPEC_v4_SOLO.md | 1074-1087 |
| # 16. DEVELOPMENT ORDER | UN_IN_GAME_SPEC_v4_SOLO.md | 1088-1118 |
| # 17. README REQUIREMENTS | UN_IN_GAME_SPEC_v4_SOLO.md | 1119-1124 |
| # 18. OPEN DECISIONS FOR THE DESIGNER | UN_IN_GAME_SPEC_v4_SOLO.md | 1125-1138 |
| # 19. CHANGES FROM v3 | UN_IN_GAME_SPEC_v4_SOLO.md | 1139-1159 |
| ## 19.1 Changes in v4.1 (desktop edition) | UN_IN_GAME_SPEC_v4_SOLO.md | 1160-1177 |
| # 20. BACKLOG — not MVP, do not implement unless asked | UN_IN_GAME_SPEC_v4_SOLO.md | 1178-1190 |
| # APPENDIX A — CONFIG FILES, VERBATIM | UN_IN_GAME_SPEC_v4_SOLO.md | 1191-1194 |
| ## A.1 `src/core/config/breeds.ts` | UN_IN_GAME_SPEC_v4_SOLO.md | 1195-1250 |
| ## A.2 `src/core/config/skins.ts` — the MVP skin set | UN_IN_GAME_SPEC_v4_SOLO.md | 1251-1299 |
| ## A.3 `src/core/config/names.ts` — default pig names | UN_IN_GAME_SPEC_v4_SOLO.md | 1300-1313 |
| ## A.4 Error codes — `src/core/config/errors.ts` | UN_IN_GAME_SPEC_v4_SOLO.md | 1314-1333 |
| # APPENDIX B — `src/i18n/vi.ts`, COMPLETE | UN_IN_GAME_SPEC_v4_SOLO.md | 1334-1624 |
| # APPENDIX C — AGENT SELF-CHECK | UN_IN_GAME_SPEC_v4_SOLO.md | 1625-1666 |

## asset/ASSET_PRODUCTION_STANDARD_v1.md

| Chủ đề | File | Dòng |
|---|---|---|
| # UN IN HOMEMADE — ASSET PRODUCTION STANDARD v1 | asset/ASSET_PRODUCTION_STANDARD_v1.md | 1-9 |
| # 0. WHY THIS DOCUMENT EXISTS | asset/ASSET_PRODUCTION_STANDARD_v1.md | 10-21 |
| # 1. MASTER ART DIRECTION | asset/ASSET_PRODUCTION_STANDARD_v1.md | 22-49 |
| # 2. SPRITE DIRECTIONS — the decision | asset/ASSET_PRODUCTION_STANDARD_v1.md | 50-51 |
| ## 2.1 Decision | asset/ASSET_PRODUCTION_STANDARD_v1.md | 52-60 |
| ## 2.2 Why not four directions | asset/ASSET_PRODUCTION_STANDARD_v1.md | 61-81 |
| ## 2.3 The one real caveat: asymmetric cosmetics | asset/ASSET_PRODUCTION_STANDARD_v1.md | 82-94 |
| ## 2.4 What replaces the extra directions | asset/ASSET_PRODUCTION_STANDARD_v1.md | 95-107 |
| # 3. ANIMATION STATES — the real gap | asset/ASSET_PRODUCTION_STANDARD_v1.md | 108-131 |
| ## 3.1 Shared overlay set — produce these once, they serve all 116 pigs | asset/ASSET_PRODUCTION_STANDARD_v1.md | 132-148 |
| ## 3.2 Where the sleep frame is genuinely worth drawing | asset/ASSET_PRODUCTION_STANDARD_v1.md | 149-154 |
| # 4. FILE FORMAT CONTRACT | asset/ASSET_PRODUCTION_STANDARD_v1.md | 155-156 |
| ## 4.1 Base pig | asset/ASSET_PRODUCTION_STANDARD_v1.md | 157-170 |
| ## 4.2 Cosmetic | asset/ASSET_PRODUCTION_STANDARD_v1.md | 171-180 |
| ## 4.3 Buildings, props, environment | asset/ASSET_PRODUCTION_STANDARD_v1.md | 181-187 |
| ## 4.4 UI icons | asset/ASSET_PRODUCTION_STANDARD_v1.md | 188-191 |
| ## 4.5 Delivery checklist per asset | asset/ASSET_PRODUCTION_STANDARD_v1.md | 192-204 |
| # 5. ANCHOR SYSTEM | asset/ASSET_PRODUCTION_STANDARD_v1.md | 205-228 |
| # 6. THE SAMPLE SHEETS — status and defects | asset/ASSET_PRODUCTION_STANDARD_v1.md | 229-232 |
| ## 6.1 Both pig sheets | asset/ASSET_PRODUCTION_STANDARD_v1.md | 233-237 |
| ## 6.2 `reference/style_reference_pigs_alt.png` specifically | asset/ASSET_PRODUCTION_STANDARD_v1.md | 238-244 |
| ## 6.3 `reference/style_reference_environment.png` | asset/ASSET_PRODUCTION_STANDARD_v1.md | 245-249 |
| ## 6.4 What to do with the sheets | asset/ASSET_PRODUCTION_STANDARD_v1.md | 250-254 |
| # 7. NAMING AND THE ASSET MANIFEST | asset/ASSET_PRODUCTION_STANDARD_v1.md | 255-256 |
| ## 7.1 Naming | asset/ASSET_PRODUCTION_STANDARD_v1.md | 257-273 |
| ## 7.2 `public/assets/manifest/assets.json` — manifest v2 | asset/ASSET_PRODUCTION_STANDARD_v1.md | 274-356 |
| ## 7.3 Directory layout | asset/ASSET_PRODUCTION_STANDARD_v1.md | 357-382 |
| ## 7.4 Asset lifecycle and validation | asset/ASSET_PRODUCTION_STANDARD_v1.md | 383-406 |
| # 8. DOCUMENT LAYOUT — settled | asset/ASSET_PRODUCTION_STANDARD_v1.md | 407-433 |
| # 9. CORRECTIONS — applied | asset/ASSET_PRODUCTION_STANDARD_v1.md | 434-437 |
| ## 9.1 Pig catalogue — `animals/PIG_CATALOGUE.md` | asset/ASSET_PRODUCTION_STANDARD_v1.md | 438-450 |
| ## 9.2 Environment catalogue — `building/ENVIRONMENT_CATALOGUE.md` | asset/ASSET_PRODUCTION_STANDARD_v1.md | 451-464 |
| # 10. PRODUCTION ORDER | asset/ASSET_PRODUCTION_STANDARD_v1.md | 465-482 |
| # 11. AI GENERATION PROMPTS — updated | asset/ASSET_PRODUCTION_STANDARD_v1.md | 483-486 |
| ## 11.1 Base pig | asset/ASSET_PRODUCTION_STANDARD_v1.md | 487-513 |
| ## 11.2 Sleep frame | asset/ASSET_PRODUCTION_STANDARD_v1.md | 514-530 |
| ## 11.3 Cosmetic | asset/ASSET_PRODUCTION_STANDARD_v1.md | 531-549 |
| ## 11.4 Negative prompt — append to every generation | asset/ASSET_PRODUCTION_STANDARD_v1.md | 550-563 |
| # 12. SUMMARY OF DECISIONS IN THIS DOCUMENT | asset/ASSET_PRODUCTION_STANDARD_v1.md | 564-581 |

## asset/AI_ASSET_GENERATION_PACK.md

| Chủ đề | File | Dòng |
|---|---|---|
| # UN IN HOMEMADE — AI ASSET GENERATION PACK | asset/AI_ASSET_GENERATION_PACK.md | 1-11 |
| # 0. THE WORKFLOW | asset/AI_ASSET_GENERATION_PACK.md | 12-24 |
| ## 0.1 Which model | asset/AI_ASSET_GENERATION_PACK.md | 25-33 |
| # 1. THE THREE UNIVERSAL BLOCKS | asset/AI_ASSET_GENERATION_PACK.md | 34-37 |
| ## 1.1 STYLE — never changes | asset/AI_ASSET_GENERATION_PACK.md | 38-46 |
| ## 1.2 OUTPUT — never changes for pigs | asset/AI_ASSET_GENERATION_PACK.md | 47-55 |
| ## 1.3 NEGATIVE PROMPT — paste into every single generation | asset/AI_ASSET_GENERATION_PACK.md | 56-75 |
| ## 1.4 Style consistency — the single most important technique | asset/AI_ASSET_GENERATION_PACK.md | 76-92 |
| # 2. TRIAGE — reject before you invest | asset/AI_ASSET_GENERATION_PACK.md | 93-110 |
| # 3. PIG PROMPT — master template | asset/AI_ASSET_GENERATION_PACK.md | 111-134 |
| ## 3.1 P0 — breed defaults. Generate these four first | asset/AI_ASSET_GENERATION_PACK.md | 135-145 |
| ## 3.2 P1 — core skin set, generate after the P0 four | asset/AI_ASSET_GENERATION_PACK.md | 146-167 |
| ## 3.3 Sleep frames | asset/AI_ASSET_GENERATION_PACK.md | 168-192 |
| # 4. SHARED FX OVERLAYS — 8 files that serve all 116 pigs | asset/AI_ASSET_GENERATION_PACK.md | 193-223 |
| # 5. BUILDINGS, PROPS AND THE TROUGH | asset/AI_ASSET_GENERATION_PACK.md | 224-241 |
| ## 5.1 P0 — core mechanic props | asset/AI_ASSET_GENERATION_PACK.md | 242-254 |
| ## 5.2 P1 — scene buildings and props | asset/AI_ASSET_GENERATION_PACK.md | 255-270 |
| # 6. UI ICONS | asset/AI_ASSET_GENERATION_PACK.md | 271-284 |
| ## 6.1 Status icons | asset/AI_ASSET_GENERATION_PACK.md | 285-296 |
| ## 6.2 System icons (new in v4) | asset/AI_ASSET_GENERATION_PACK.md | 297-305 |
| ## 6.3 Action buttons | asset/AI_ASSET_GENERATION_PACK.md | 306-321 |
| # 7. COSMETICS | asset/AI_ASSET_GENERATION_PACK.md | 322-340 |
| ## 7.1 Core cosmetic set — matches the catalogue §33 P1 list | asset/AI_ASSET_GENERATION_PACK.md | 341-369 |
| # 8. POST-PROCESSING — step 3, mandatory | asset/AI_ASSET_GENERATION_PACK.md | 370-373 |
| ## 8.1 Pigs and cosmetics | asset/AI_ASSET_GENERATION_PACK.md | 374-396 |
| ## 8.2 Buildings and props | asset/AI_ASSET_GENERATION_PACK.md | 397-400 |
| ## 8.3 Verification before accepting | asset/AI_ASSET_GENERATION_PACK.md | 401-412 |
| # 9. REGISTRATION — step 4 | asset/AI_ASSET_GENERATION_PACK.md | 413-451 |
| # 10. THE COMPLETE WAVE 1 + WAVE 2 SHOPPING LIST | asset/AI_ASSET_GENERATION_PACK.md | 452-474 |
