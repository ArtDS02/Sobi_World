# FIX REPORT — Vòng 01

> round: 1 · targets run: `20261104-152903-755dce5-f5ba39e3` · Developer · ngày 2026-11-04 · `npm run check` **xanh** (132 file test, 1725 test)
> Chưa commit (theo vai trò: chỉ commit khi chủ dự án yêu cầu). Self-check bằng `anim:capture --only` (run tạm của dev, đã xóa; **không** thay run chính thức của Tester, `LATEST.json` giữ nguyên).

## 1. Theo ID
| ID | Kết quả | Mô tả | Tự kiểm |
|---|---|---|---|
| ANIM-110 | **fixed** | Thêm act `stop` tier `ultimate` (220 ms) + `shake` 3 tại điểm buff bùng ra cho `skill_ult_qs` (t=1850), `skill_ult_qt` (t=1750), `skill_ult_mm` (t=1500) trong `battle_fx.json`. Theo quyết định D-1 (giữ rubric). Test cũ ghi "ultimate hỗ trợ không có hit-stop" đã đổi: mọi ultimate phải có `stop` tier `ultimate`. | self-check `ult_qs`: `hitStopMs = 220` (trước: null). Test `buffLanguage.test.ts` (it.each 12 ultimate). `qt`/`mm` chỉ có test, chưa chụp. |
| ANIM-111 | **fixed** | Cue mới `still` (`ui/battlePlan.ts`): khi `reduce`, vẫn có vòng tĩnh dưới người ra đòn từ lúc lấy đà tới `impact`+250 ms và vòng tĩnh dưới mỗi mục tiêu lúc `impact` (700 ms). `fxPlayer.ts` vẽ vòng (không xoay, không chớp, fade vào/ra); `BattleScene` cho phép `still` kể cả khi `reduce`. Không thêm rung/chớp/zoom/khựng. | `variant.skill_cl_taunt.reduce`: `changedFrames` 1 → 4; sheet thấy vòng dưới heo ra đòn suốt lấy đà. Test `battleFx.test.ts`, `battleScript.test.ts`. `variant.ult_nh.reduce` chưa chụp lại. |
| ANIM-112 | **fixed (một phần)** | (a) Schema `skills.<id>.circleMs`; `battleMotion.circleOf` đọc nó. 12 ultimate có `circleMs` 420–1000 ms và `timing.release` 300–700 ms (khác nhau). (b) Cut-in có `style` (`slash`/`bars`/`rise`/`ring`) trong schema; module mới `fxCutin.ts`; mỗi kiểu 3 ultimate. **Chưa làm:** tên chiêu / biểu tượng riêng trong cut-in (cần art/i18n, §4). | `ult_qs`: anticipation 500 → 600, circle 820 → 900; khung `t=1200` thấy cột ochre dâng lên với chân dung. Test: ≥ 8 giá trị `circleMs`, ≥ 8 giá trị `release`, đủ 4 kiểu. Các ultimate khác chưa chụp. |
| ANIM-114 | **partial; disagree một phần** | Cặp `matkUp`≡`accUp` và `atkDown`≡`matkDown` là **dương tính giả của harness**: lab phát cho mỗi status *cùng một skill* đang đặt nhiều status (`skill_qt_guiding_lamp` đặt accUp+matkUp; `skill_cl_spell_storm` đặt atkDown+matkDown+spdDown; xem `config.skill` trong manifest). Script của status Up khác nhau thật (matkUp: vòng rune; accUp: tâm ngắm). **Phần thật:** 7 debuff Down chỉ khác một hạt nên mỗi cái nay có hình riêng trong `apply`: atkDown kiếm rơi, defDown khiên rơi, matkDown vòng phong ấn, mdefDown khóa rune, accDown tâm ngắm rơi, evaDown tảng đá rơi xuống chân, spdDown vết mực ở chân; tất cả ≤ 380 ms, màu trầm. | Test mới: 7 debuff có chuỗi hình `prop/strip` khác nhau; `buffLanguage.test.ts` (≤ 400 ms) xanh. Sheet `status.defDown`: hình khiên bị cú nổ của skill `armor_break` che nên **chưa xác nhận bằng mắt** (§3). |
| ANIM-119 | **fixed** | Thêm `expire` cho 7 debuff (khói `puff_rise` màu trầm + thân hồi `puff_up` 1.06, 260 ms). Nay 25/25 status có `expire`; test ép điều đó. | Test `statuses have a start, a lasting look and an end`. Chưa chụp pha expire (harness chưa có, FEEDBACK §5.1). |
| ANIM-117 | wontfix (vòng này) | Cần art glyph theo hệ (đã có trong kế hoạch art A04). Minor, không làm. | — |
| ANIM-113 | disagree (taste) | Nhịp ultimate đã phân hoá theo ANIM-112; không ép về 150–300 ms (rubric §5 "không phải luật cứng"). | — |

## 2. File đã đổi + SHA-1 (sau khi sửa)
| file | git hash-object |
|---|---|
| `content/adventure/battle_fx.json` | `4c982ce901359ce2594c799b5021baba74997aaf` |
| `content/schemas/adventure/battleFx.ts` | `12689b3f96fe33d0b45bf7a36b0e13269ca7d2ed` |
| `content/schemas/adventure/battleScript.ts` | `28dbab6e310cbf9048208e7e04de414a27136937` |
| `src/areas/adventure/ui/battleMotion.ts` | `d850f4a27a3c302d73ede92a79479def6a069c68` |
| `src/areas/adventure/ui/battlePlan.ts` | `5bc2a8a7a34b17d3ac094ed8e2b461fe8d462cc4` |
| `src/areas/adventure/scene/battle/BattleScene.ts` | `10ff5d8c2612a4703828ecef05a947e33aceb324` |
| `src/areas/adventure/scene/battle/fxActs.ts` | `0c1a3da154d6303a6bce14f59bd58858bbe25ac4` |
| `src/areas/adventure/scene/battle/fxCutin.ts` | `91d720e10be4bbca544fe27ec901d4c1961cce97` |
| `src/areas/adventure/scene/battle/fxPlayer.ts` | `4fc5275145eccd8b416200a03fefc9194bb0cac8` |
| `tests/unit/battleFx.test.ts` | `337819c9a2c8a68818e2d3fc26c4e6012af6772a` |
| `tests/unit/battleScript.test.ts` | `67f61eeaaa3cf2e487b5739b8be82f319a14d354` |
| `tests/unit/buffLanguage.test.ts` | `a14c0216630da462d4889896050f0617bcaa1ebc` |

(`npm run content:fmt` đã định dạng lại `battle_fx.json`.)

## 3. Tester nên chụp thêm
- `battle.ult.*` (cả 12): cut-in đổi kiểu, `circleMs`/`release` đổi; `skill_ult_qt`, `skill_ult_mm` có hit-stop mới.
- `battle.variant.*.reduce` (nhất là `variant.skill_ult_nh.reduce`): vòng tĩnh mới.
- `battle.status.*Down.apply`: hình mới. **Gợi ý:** case status nên phát *status đó đứng một mình* (hook đặt status trực tiếp); hiện hình riêng của debuff bị skill gốc che.
- Pha `expire` của 7 debuff vừa thêm (cần case chủ động gỡ status, FEEDBACK §5.1).

## 4. Phát hiện thêm / rủi ro / việc chưa làm
- Cut-in vẫn dùng chân dung nhân vật; "tên chiêu / biểu tượng riêng" mỗi ultimate cần art hoặc chữ i18n → đề xuất ANIM-112b, **cần chủ dự án quyết** (art chỉ ở GĐ14).
- `timing.release` của ultimate hiện đổi nhịp *tư thế*; `at` của các act vẫn tính từ `cast`. Nếu TD muốn khác biệt mạnh hơn, phải chỉnh `at` trong từng script (việc nội dung lớn).
- Cue `still` dùng texture vòng phép có sẵn, không thêm asset.
- `fxPlayer.ts` nay 288 dòng (guard ≤ 300): nên tách khi thêm cue tiếp theo.

## 5. `npm run check`
Xanh (typecheck, lint, guard, assets:check, 132 file / 1725 test). Test đã sửa: `battleFx.test.ts`, `battleScript.test.ts` (reduce có `still`), `buffLanguage.test.ts` (mọi ultimate có hit-stop; nhịp/kiểu cut-in; expire; 7 debuff khác hình).
