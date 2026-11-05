# FIX REPORT — Vòng 02

> round: 2 · targets run: `20261104-161729-755dce5-36236937` · Developer · 2026-11-04
> `npm run check`: typecheck, lint, guard, assets **xanh**; `vitest run` **132 file / 1728 test xanh** khi chạy `--maxWorkers=4`. Chạy mặc định (tất cả worker) thì `tests/unit/phase11.test.ts` "balance guard (decision 037)" **hết 20 s** (3 lần liên tiếp), nhưng pass khi chạy riêng (10 s cả file) và pass khi giới hạn worker; test này mô phỏng cân bằng, không liên quan animation (xem §4).
> Chưa commit. Self-check bằng `anim:capture --only` (các run tạm đã xóa; `LATEST.json` giữ nguyên).

## 1. Theo ID
| ID | Kết quả | Mô tả | Tự kiểm |
|---|---|---|---|
| ANIM-120 | **fixed** | Mọi `expire` (trừ freeze/burn/doom đã rõ) có thêm hình lớn: `strip fx_poof` tô màu của status (size 2.5–2.7) + vòng `decal ring` size 3 cho buff, `glow` trắng 1.9 cho debuff; stun thêm `fx_pow_star` 3.2; wet thêm `fx_splash` 3.2 + hạt giọt rơi; poison/disable/shield có poof + vòng. Mỗi expire ≤ 400 ms. | `maxChangeVsStart` (mẫu 8 case): wet 18.1%, stun 17.4%, regen 13.6%, defUp 13.4%, atkUp 13.0%, atkDown 12.5%, accDown 12.5%, poison 10.5% (trước 3.8–5.4%). Ngưỡng TD: ≥ 8% (≥ 15% stun, wet) ✓. Test mới: mọi expire (trừ 3 status đã rõ) có `strip`/`decal`/`prop`. |
| ANIM-114 | **fixed** | (b) Hai cặp Up nay khác hình apply: `defUp` thêm `fxp_bronze_shield` (khiên đồng bật lên), `mdefUp` đổi vòm thành `fx_wind_swirl` (xoáy kết giới), `matkUp` thêm `fxp_seal_circle` (vòng phong ấn rune), `accUp` thêm `fxp_crosshair` (tâm ngắm). (a) 7 debuff Down: hình riêng to hơn (0.3→0.55, 0.22→0.45; strip 0.7→1.2, 0.8→1.3) và sáng hơn (`#6b4a8a`→`#b79adf`). | Test mới ép: không hai status nào có chữ ký apply (do + ref/img, bỏ màu) trùng nhau (cả 25); mọi Down có hình riêng cỡ ≥ 0.45. Sheet `status.atkDown.apply` t=650/750: thanh kiếm tím rơi trên đầu sói thấy rõ (trước ~20 px). Chưa chụp lại `mdefUp`/`matkUp`/`accUp` sheet từng case (chỉ test + chạy chụp tạm thành công). |
| ANIM-112 | **fixed (theo D-2: chữ)** | Cut-in có **tên chiêu** (`SKILLS[id].nameVi`, từ i18n) viết trong cut-in (font Baloo 2, chữ trắng viền tím tối, hiện/ẩn theo nhịp). `ScriptCue.title` mới (chỉ gắn cho act `cutin`). Kiểu `ring` đổi: viền sáng dày + nền mờ 0.16 + đĩa 0.55 giữ chân dung, sân vẫn thấy qua. | Khung `ult_qt` t=900: đĩa vàng + chân dung + "Lồng Đèn Trung Thu" đọc rõ, sân thấy qua; `ult_nh` t=1270: "Tiếng Hát Đại Dương". Test: cue cutin mang tên skill. Chưa chụp lại 10 ultimate còn lại; tên chiêu tự lấy theo từng skill. |
| ANIM-054 | fixed (một phần) | `wet.expire` có nước tung/giọt rơi (18% khung). Pha loop của wet **chưa đổi** (vẫn chỉ huy hiệu giọt nước). | `wet.expire` đo; loop chưa. |
| ANIM-123 | chưa làm | Họ skill hồi máu cùng bộ hạt — minor, hết thời gian vòng này. | — |
| ANIM-117 | wontfix (vòng này) | Cần art glyph theo hệ. | — |

## 2. File đã đổi + SHA-1 (sau khi sửa)
| file | git hash-object |
|---|---|
| `content/adventure/battle_fx.json` | `68f005f873cc73fb365d09e6feb4a0d4fe4d37fe` |
| `src/areas/adventure/ui/battleScript.ts` | `5f9b9cc2b802cf1ae176a0102fcca040cf4e0a6d` |
| `src/areas/adventure/scene/battle/fxActs.ts` | `827eaa74840c0ee0709ac943a440edeabf3eb03f` |
| `src/areas/adventure/scene/battle/fxCutin.ts` | `49529d55444da81f20345233502a42b72bf9205e` |
| `tests/unit/buffLanguage.test.ts` | `7ce596424a6093e348cb84b9f2649d1da7bf2945` |
| `tests/unit/battleScript.test.ts` | `983f8ccc2c233549be274095758910dc22751af3` |

(`npm run content:fmt` đã định dạng lại `battle_fx.json`; `fxActs.ts` chỉ truyền `cue.title`.)

## 3. Tester nên chụp thêm
- 12 `battle.ult.*` (tên chiêu, kiểu cut-in mới; chú ý chữ có dài làm tràn khung ở tên chiêu dài).
- Toàn bộ `battle.status.*.expire` (25) và `*.apply` của defUp/mdefUp/matkUp/accUp/7 Down; `reduce` của ultimate (cut-in không phát khi reduce, banner DOM tên chiêu giữ nguyên).
- Gợi ý lặp lại: case status nên phát status đứng một mình (không có đòn thường che).
- Đã có sheet tham chiếu từ self-check: không lưu (đã xóa).

## 4. Phát hiện thêm / rủi ro / chưa làm
- **`tests/unit/phase11.test.ts` balance guard hết 20 s khi chạy full mặc định** (3 lần trên máy này, trước đó 2 lần liền pass). Nguyên nhân gần như chắc chắn là tải CPU (đang chạy `npm run admin` và nhiều tiến trình Chrome của người dùng): pass riêng (10 s) và pass với `--maxWorkers=4` (132/132). Không do thay đổi này (chỉ sửa content animation + 2 file scene). Cần quan sát nếu tái diễn: có thể nâng timeout test đó hoặc giảm worker trong CI.
- Tên chiêu dài có thể tràn chiều ngang (đã đặt `wordWrap` 80% bề rộng); cần xem trên 12 ultimate.
- Cut-in không phát khi `reduce` (như trước); tên chiêu vẫn có ở banner DOM.

## 5. Tiêu chí TD (FEEDBACK vòng 2) đối chiếu
| Tiêu chí | Trạng thái |
|---|---|
| ANIM-120: expire `maxChangeVsStart` ≥ 8% (≥ 15% stun, wet) | đạt ở mẫu 8/25 đã đo; 17 còn lại chưa đo |
| ANIM-114: chữ ký apply không trùng; che màu phân biệt; hình Down đọc được ở `impact+200` | chữ ký ✓ (test); hình Down ✓ (một sheet); phân biệt khi che màu cần TD |
| ANIM-112: ô cut-in phân biệt ≥ 10/12 kể cả bỏ màu; không che quá 70% sân | tên chiêu ✓; chưa chụp cả 12 |
