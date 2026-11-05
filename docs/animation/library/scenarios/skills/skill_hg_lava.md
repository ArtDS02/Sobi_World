# Kịch bản: Phun Dung Nham (`skill_hg_lava`)

```json scenario
{
  "id": "skill_hg_lava", "kind": "skill", "name": "Phun Dung Nham", "element": "FIRE", "tier": 2, "durationMs": 1450,
  "status": "draft", "refs": [], "bibles": ["elements/FIRE"],
  "assets": [
    { "id": "fx_lava_pop", "state": "have", "layer": "L1" },
    { "id": "fx_crack_spread", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô đỏ cam, khe dung nham dưới phe địch)" },
    { "id": "fx_fire_blast", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_ember", "state": "have", "layer": "L3" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Cua **cắm càng xuống đất**, **khe đỏ chạy** dưới phe địch, mặt đất đỏ dần; **dung nham phụt lên** dưới từng quái lệch nhịp, **cục dung nham bay vồng** rơi lại; quái **nhảy cẫng hai lần** vì nóng; vũng nguội thành **đá đen nứt**. Cảm giác: sôi sục, "blorp". T2 diện rộng, 50 % Bỏng.

## 2. Hiện tại
`fx_lava_pop` + `fx_flame_burst` cùng lúc dưới mọi quái + decal. Audit: `DURATION_OVER` (1550). Không có khe chạy, không có cục dung nham, không có nguội.

## 3. Kịch bản theo nhịp
| # | ms | Cua | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Cắm | 0–400 | pose `cast`, **cắm càng** xuống | **khe đỏ chạy** từ càng sang phe địch, đất dưới quái **đỏ dần** | giật mình nhìn xuống | nền cam 10 % | "krrrk" |
| 2 Phụt | 400–760 | giữ | dung nham **phụt** dưới từng quái (stagger 120), **cục dung nham bay vồng** lên rồi rơi | nhảy cẫng 2 lần | hit-stop light 60 ở con đầu, rung 4 | "blorp" ×n |
| 3 Nổ | 500–900 | — | nổ lửa nhỏ ở chân, tàn bay lên | — | — | xèo |
| 4 Nguội | 900–1450 | rút càng | vũng **sẫm dần → đá đen nứt**, khói bốc; `st_burn` | thổi chân | nền về | "fsss" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền cam | — | `tint #ff7a2a 0.1` | 0–1400 |
| L1 | khe đỏ; dung nham phụt; cục dung nham | `fx_crack_spread` (đỏ cam), `fx_lava_pop`, `fxs_ember` (to, tô đỏ) | `strip fx_crack_spread under` 0–400; `strip fx_lava_pop` per target stagger 120; `prop throw` cục dung nham lên-xuống (arc 70, `fall` về chỗ) per target | 0–1000 |
| L2 | đất dưới quái đỏ dần | — | `decal scorch` đỏ alpha tăng 100–400 | 100–900 |
| L3 | nổ nhỏ; tàn; khói; đá nguội | `fx_fire_blast` (0,5), `fxs_ember`, `fxs_puff` | `strip fx_fire_blast` per target; `burst ember_rise`; `burst puff_rise` 1000; `decal crack #3a2a20` 900–1450 | 500–1450 |
| L4 | nhảy cẫng ×2; hit-stop | — | `move hop` ×2 per target; `stop light`; `shake 4` | 400–1000 |
L1 đạt 3/3: biến hình (khe lan, phụt khung) · phụ sinh (cục dung nham, tàn) · vận tốc (cục bay vồng).

## 5. Asset
`fx_crack_spread`, `fx_fire_blast` **mới**; dự phòng `decal crack` đỏ, `fx_flame_burst`.

## 6. Các bước dựng
B1 nhịp `{ release 400, impact 400, end 1450 }` (rút 100) · B2 cắm càng; quái nhảy ×2 · B3 khe → phụt → cục dung nham · B4 nổ, tàn, khói, đá nguội · B5 hit-stop light (rung 6 → 4) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_OVER`; capture: khung ~200 khe **mới tới giữa**; khung ~1200 vết dưới quái **sẫm / nứt** (khác khung 600 đỏ).
