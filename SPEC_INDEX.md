# SPEC_INDEX

Đọc spec theo khoảng dòng: `sed -n 'start,endp' <file>`. Sinh tự động từ heading (bỏ qua code fence).

## UN_IN_GAME_SPEC_v4_SOLO.md

| Chủ đề | File | Dòng |
|---|---|---|
| # UN IN HOMEMADE — SOLO EDITION | UN_IN_GAME_SPEC_v4_SOLO.md | 1-1 |
| ## Implementation Specification v4.0 | UN_IN_GAME_SPEC_v4_SOLO.md | 2-18 |
| # 0. IMPLEMENTATION CONTRACT | UN_IN_GAME_SPEC_v4_SOLO.md | 19-33 |
| # 1. WHY v4 EXISTS — the three problems in v3 | UN_IN_GAME_SPEC_v4_SOLO.md | 34-37 |
| ### 1.1 The player never had to play | UN_IN_GAME_SPEC_v4_SOLO.md | 38-45 |
| ### 1.2 There was nothing to spend gold on and nothing to aim at | UN_IN_GAME_SPEC_v4_SOLO.md | 46-51 |
| ### 1.3 The spec and the asset bible describe two different games | UN_IN_GAME_SPEC_v4_SOLO.md | 52-59 |
| # 2. DECISIONS REGISTER | UN_IN_GAME_SPEC_v4_SOLO.md | 60-91 |
| # 3. PRODUCT OVERVIEW | UN_IN_GAME_SPEC_v4_SOLO.md | 92-93 |
| ## 3.1 Core loop | UN_IN_GAME_SPEC_v4_SOLO.md | 94-110 |
| ## 3.2 Design priorities | UN_IN_GAME_SPEC_v4_SOLO.md | 111-119 |
| ## 3.3 Session shape the design targets | UN_IN_GAME_SPEC_v4_SOLO.md | 120-127 |
| # 4. TECHNOLOGY STACK | UN_IN_GAME_SPEC_v4_SOLO.md | 128-156 |
| ## 4.1 Directory structure | UN_IN_GAME_SPEC_v4_SOLO.md | 157-195 |
| # 5. DATA MODEL | UN_IN_GAME_SPEC_v4_SOLO.md | 196-199 |
| ## 5.1 Save document | UN_IN_GAME_SPEC_v4_SOLO.md | 200-242 |
| ## 5.2 Pig — breed and appearance are separate axes (D19) | UN_IN_GAME_SPEC_v4_SOLO.md | 243-271 |
| ## 5.3 Orders, transactions, breeding records | UN_IN_GAME_SPEC_v4_SOLO.md | 272-307 |
| ## 5.4 Derived values (never stored) | UN_IN_GAME_SPEC_v4_SOLO.md | 308-322 |
| ## 5.5 Invariants | UN_IN_GAME_SPEC_v4_SOLO.md | 323-328 |
| # 6. CONFIGURATION — single source of truth | UN_IN_GAME_SPEC_v4_SOLO.md | 329-332 |
| ## 6.1 Breeds | UN_IN_GAME_SPEC_v4_SOLO.md | 333-343 |
| ## 6.2 Derived per-breed care budgets (D16) | UN_IN_GAME_SPEC_v4_SOLO.md | 344-357 |
| ## 6.3 Items | UN_IN_GAME_SPEC_v4_SOLO.md | 358-364 |
| ## 6.4 Balance constants (TUNABLE) | UN_IN_GAME_SPEC_v4_SOLO.md | 365-435 |
| ## 6.5 Breeding matrix | UN_IN_GAME_SPEC_v4_SOLO.md | 436-475 |
| ## 6.6 Breed to artwork mapping — the bridge to the asset bible | UN_IN_GAME_SPEC_v4_SOLO.md | 476-508 |
| # 7. TIME SIMULATION ENGINE | UN_IN_GAME_SPEC_v4_SOLO.md | 509-512 |
| ## 7.1 When to advance | UN_IN_GAME_SPEC_v4_SOLO.md | 513-516 |
| ## 7.2 `advancePig` — piecewise, unchanged from v3 except for the rates | UN_IN_GAME_SPEC_v4_SOLO.md | 517-577 |
| ## 7.3 `resolveTrough` — auto-feeding, closed form (D17) | UN_IN_GAME_SPEC_v4_SOLO.md | 578-601 |
| ## 7.4 `advanceWorld` | UN_IN_GAME_SPEC_v4_SOLO.md | 602-617 |
| # 8. ACTIONS | UN_IN_GAME_SPEC_v4_SOLO.md | 618-640 |
| ## 8.1 `buyPig({ breed, gender })` | UN_IN_GAME_SPEC_v4_SOLO.md | 641-646 |
| ## 8.2 `feedPig({ pigId })` — manual fallback | UN_IN_GAME_SPEC_v4_SOLO.md | 647-651 |
| ## 8.3 `cleanPig({ pigId })` | UN_IN_GAME_SPEC_v4_SOLO.md | 652-655 |
| ## 8.4 `cleanAll()` — MVP quality of life, promoted from v3 backlog | UN_IN_GAME_SPEC_v4_SOLO.md | 656-659 |
| ## 8.5 `treatPig({ pigId })` | UN_IN_GAME_SPEC_v4_SOLO.md | 660-663 |
| ## 8.6 `fillTrough({ units })` | UN_IN_GAME_SPEC_v4_SOLO.md | 664-669 |
| ## 8.7 `sellPig({ pigId })` | UN_IN_GAME_SPEC_v4_SOLO.md | 670-675 |
| ## 8.8 `breedPigs({ pigAId, pigBId })` | UN_IN_GAME_SPEC_v4_SOLO.md | 676-688 |
| ## 8.9 Birth — automatic, inside `advanceWorld` | UN_IN_GAME_SPEC_v4_SOLO.md | 689-697 |
| ## 8.10 `buyItem({ itemId, quantity })` | UN_IN_GAME_SPEC_v4_SOLO.md | 698-700 |
| ## 8.11 `buySlot()` | UN_IN_GAME_SPEC_v4_SOLO.md | 701-705 |
| ## 8.12 `renamePig({ pigId, name })` | UN_IN_GAME_SPEC_v4_SOLO.md | 706-708 |
| ## 8.13 Skins — `buySkin({ skinId })` and `equipSkin({ pigId, skinId })` (D19) | UN_IN_GAME_SPEC_v4_SOLO.md | 709-713 |
| ## 8.14 Orders (D20) | UN_IN_GAME_SPEC_v4_SOLO.md | 714-744 |
| ## 8.15 Collection book | UN_IN_GAME_SPEC_v4_SOLO.md | 745-747 |
| ## 8.16 XP, level and gold | UN_IN_GAME_SPEC_v4_SOLO.md | 748-754 |
| # 9. PERSISTENCE | UN_IN_GAME_SPEC_v4_SOLO.md | 755-756 |
| ## 9.1 Save and load (D2) | UN_IN_GAME_SPEC_v4_SOLO.md | 757-764 |
| ## 9.2 Corruption and safety | UN_IN_GAME_SPEC_v4_SOLO.md | 765-769 |
| ## 9.3 Export and import | UN_IN_GAME_SPEC_v4_SOLO.md | 770-773 |
| ## 9.4 Browser storage caveats that must be handled | UN_IN_GAME_SPEC_v4_SOLO.md | 774-778 |
| ## 9.5 Away summary | UN_IN_GAME_SPEC_v4_SOLO.md | 779-785 |
| # 10. UI / UX | UN_IN_GAME_SPEC_v4_SOLO.md | 786-787 |
| ## 10.1 Layout | UN_IN_GAME_SPEC_v4_SOLO.md | 788-805 |
| ## 10.2 Selected pig panel | UN_IN_GAME_SPEC_v4_SOLO.md | 806-822 |
| ## 10.3 First-run tutorial | UN_IN_GAME_SPEC_v4_SOLO.md | 823-825 |
| ## 10.4 Responsive | UN_IN_GAME_SPEC_v4_SOLO.md | 826-831 |
| ## 10.5 i18n | UN_IN_GAME_SPEC_v4_SOLO.md | 832-836 |
| # 11. PHASER AND VISUAL STATE | UN_IN_GAME_SPEC_v4_SOLO.md | 837-863 |
| # 12. AUDIO | UN_IN_GAME_SPEC_v4_SOLO.md | 864-886 |
| # 13. PWA AND OFFLINE | UN_IN_GAME_SPEC_v4_SOLO.md | 887-897 |
| # 14. TESTING | UN_IN_GAME_SPEC_v4_SOLO.md | 898-901 |
| ## 14.1 Engine golden values | UN_IN_GAME_SPEC_v4_SOLO.md | 902-919 |
| ## 14.2 Trough tests (new, and the most failure-prone area) | UN_IN_GAME_SPEC_v4_SOLO.md | 920-927 |
| ## 14.3 Action tests | UN_IN_GAME_SPEC_v4_SOLO.md | 928-930 |
| ## 14.4 Breeding tests | UN_IN_GAME_SPEC_v4_SOLO.md | 931-933 |
| ## 14.5 Orders and collection tests | UN_IN_GAME_SPEC_v4_SOLO.md | 934-936 |
| ## 14.6 Save tests | UN_IN_GAME_SPEC_v4_SOLO.md | 937-939 |
| ## 14.7 Economy simulation | UN_IN_GAME_SPEC_v4_SOLO.md | 940-942 |
| ## 14.8 Optional smoke test (Playwright) | UN_IN_GAME_SPEC_v4_SOLO.md | 943-947 |
| # 15. ACCEPTANCE CRITERIA | UN_IN_GAME_SPEC_v4_SOLO.md | 948-959 |
| # 16. DEVELOPMENT ORDER | UN_IN_GAME_SPEC_v4_SOLO.md | 960-985 |
| # 17. README REQUIREMENTS | UN_IN_GAME_SPEC_v4_SOLO.md | 986-991 |
| # 18. OPEN DECISIONS FOR THE DESIGNER | UN_IN_GAME_SPEC_v4_SOLO.md | 992-1005 |
| # 19. CHANGES FROM v3 | UN_IN_GAME_SPEC_v4_SOLO.md | 1006-1028 |
| # 20. BACKLOG — not MVP, do not implement unless asked | UN_IN_GAME_SPEC_v4_SOLO.md | 1029-1039 |
| # APPENDIX A — CONFIG FILES, VERBATIM | UN_IN_GAME_SPEC_v4_SOLO.md | 1040-1043 |
| ## A.1 `src/core/config/breeds.ts` | UN_IN_GAME_SPEC_v4_SOLO.md | 1044-1099 |
| ## A.2 `src/core/config/skins.ts` — the MVP skin set | UN_IN_GAME_SPEC_v4_SOLO.md | 1100-1148 |
| ## A.3 `src/core/config/names.ts` — default pig names | UN_IN_GAME_SPEC_v4_SOLO.md | 1149-1162 |
| ## A.4 Error codes — `src/core/config/errors.ts` | UN_IN_GAME_SPEC_v4_SOLO.md | 1163-1182 |
| # APPENDIX B — `src/i18n/vi.ts`, COMPLETE | UN_IN_GAME_SPEC_v4_SOLO.md | 1183-1463 |
| # APPENDIX C — AGENT SELF-CHECK | UN_IN_GAME_SPEC_v4_SOLO.md | 1464-1497 |

## asset/ASSET_PRODUCTION_STANDARD_v1.md

| Chủ đề | File | Dòng |
|---|---|---|
| # UN IN HOMEMADE — ASSET PRODUCTION STANDARD v1 | asset/ASSET_PRODUCTION_STANDARD_v1.md | 1-8 |
| # 0. WHY THIS DOCUMENT EXISTS | asset/ASSET_PRODUCTION_STANDARD_v1.md | 9-20 |
| # 1. MASTER ART DIRECTION | asset/ASSET_PRODUCTION_STANDARD_v1.md | 21-48 |
| # 2. SPRITE DIRECTIONS — the decision | asset/ASSET_PRODUCTION_STANDARD_v1.md | 49-50 |
| ## 2.1 Decision | asset/ASSET_PRODUCTION_STANDARD_v1.md | 51-59 |
| ## 2.2 Why not four directions | asset/ASSET_PRODUCTION_STANDARD_v1.md | 60-80 |
| ## 2.3 The one real caveat: asymmetric cosmetics | asset/ASSET_PRODUCTION_STANDARD_v1.md | 81-93 |
| ## 2.4 What replaces the extra directions | asset/ASSET_PRODUCTION_STANDARD_v1.md | 94-106 |
| # 3. ANIMATION STATES — the real gap | asset/ASSET_PRODUCTION_STANDARD_v1.md | 107-130 |
| ## 3.1 Shared overlay set — produce these once, they serve all 116 pigs | asset/ASSET_PRODUCTION_STANDARD_v1.md | 131-147 |
| ## 3.2 Where the sleep frame is genuinely worth drawing | asset/ASSET_PRODUCTION_STANDARD_v1.md | 148-153 |
| # 4. FILE FORMAT CONTRACT | asset/ASSET_PRODUCTION_STANDARD_v1.md | 154-155 |
| ## 4.1 Base pig | asset/ASSET_PRODUCTION_STANDARD_v1.md | 156-169 |
| ## 4.2 Cosmetic | asset/ASSET_PRODUCTION_STANDARD_v1.md | 170-179 |
| ## 4.3 Buildings, props, environment | asset/ASSET_PRODUCTION_STANDARD_v1.md | 180-186 |
| ## 4.4 UI icons | asset/ASSET_PRODUCTION_STANDARD_v1.md | 187-190 |
| ## 4.5 Delivery checklist per asset | asset/ASSET_PRODUCTION_STANDARD_v1.md | 191-203 |
| # 5. ANCHOR SYSTEM | asset/ASSET_PRODUCTION_STANDARD_v1.md | 204-227 |
| # 6. THE SAMPLE SHEETS — status and defects | asset/ASSET_PRODUCTION_STANDARD_v1.md | 228-231 |
| ## 6.1 Both pig sheets | asset/ASSET_PRODUCTION_STANDARD_v1.md | 232-236 |
| ## 6.2 `reference/style_reference_pigs_alt.png` specifically | asset/ASSET_PRODUCTION_STANDARD_v1.md | 237-243 |
| ## 6.3 `reference/style_reference_environment.png` | asset/ASSET_PRODUCTION_STANDARD_v1.md | 244-248 |
| ## 6.4 What to do with the sheets | asset/ASSET_PRODUCTION_STANDARD_v1.md | 249-253 |
| # 7. NAMING AND THE ASSET MANIFEST | asset/ASSET_PRODUCTION_STANDARD_v1.md | 254-255 |
| ## 7.1 Naming | asset/ASSET_PRODUCTION_STANDARD_v1.md | 256-272 |
| ## 7.2 `public/assets/manifest/assets.json` | asset/ASSET_PRODUCTION_STANDARD_v1.md | 273-314 |
| ## 7.3 Directory layout | asset/ASSET_PRODUCTION_STANDARD_v1.md | 315-333 |
| # 8. DOCUMENT LAYOUT — settled | asset/ASSET_PRODUCTION_STANDARD_v1.md | 334-360 |
| # 9. CORRECTIONS — applied | asset/ASSET_PRODUCTION_STANDARD_v1.md | 361-364 |
| ## 9.1 Pig catalogue — `animals/PIG_CATALOGUE.md` | asset/ASSET_PRODUCTION_STANDARD_v1.md | 365-377 |
| ## 9.2 Environment catalogue — `building/ENVIRONMENT_CATALOGUE.md` | asset/ASSET_PRODUCTION_STANDARD_v1.md | 378-391 |
| # 10. PRODUCTION ORDER | asset/ASSET_PRODUCTION_STANDARD_v1.md | 392-409 |
| # 11. AI GENERATION PROMPTS — updated | asset/ASSET_PRODUCTION_STANDARD_v1.md | 410-413 |
| ## 11.1 Base pig | asset/ASSET_PRODUCTION_STANDARD_v1.md | 414-440 |
| ## 11.2 Sleep frame | asset/ASSET_PRODUCTION_STANDARD_v1.md | 441-457 |
| ## 11.3 Cosmetic | asset/ASSET_PRODUCTION_STANDARD_v1.md | 458-476 |
| ## 11.4 Negative prompt — append to every generation | asset/ASSET_PRODUCTION_STANDARD_v1.md | 477-490 |
| # 12. SUMMARY OF DECISIONS IN THIS DOCUMENT | asset/ASSET_PRODUCTION_STANDARD_v1.md | 491-505 |

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
| # 9. REGISTRATION — step 4 | asset/AI_ASSET_GENERATION_PACK.md | 413-449 |
| # 10. THE COMPLETE WAVE 1 + WAVE 2 SHOPPING LIST | asset/AI_ASSET_GENERATION_PACK.md | 450-472 |

