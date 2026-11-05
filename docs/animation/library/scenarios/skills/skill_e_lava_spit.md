# Kịch bản: Phun Dung Nham (`skill_e_lava_spit`) — quái

```json scenario
{
  "id": "skill_e_lava_spit", "kind": "skill", "name": "Phun Dung Nham (quái)", "element": "FIRE", "tier": 2, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["elements/FIRE", "actions/projectile"],
  "assets": [
    { "id": "fx_energy_orb", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô đỏ cam dung nham, size 0,35)" },
    { "id": "fx_lava_pop", "state": "have", "layer": "L1" },
    { "id": "fxs_ember", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_flipbook"]
}
```

## 1. Ý tưởng
Kỳ nhông **phồng má đỏ**, **nhổ "ptooey"** một **cục dung nham sôi** bay **vồng cao**, rơi **vỡ thành ba mảng nóng** trên mục tiêu; mục tiêu **nhảy nhót** vì nóng. Cảm giác: hài, nóng rẫy. T2, 40 % Bỏng. Kỳ Nhông Dung Nham, Tượng Lửa.

## 2. Hiện tại
`fxs_ember` (một sprite) bay vồng + `fx_lava_pop`. Audit: `STATIC_HERO`, `STATIC_SHARE` (dư âm đã thêm).

## 3. Kịch bản theo nhịp
| # | ms | Quái | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Phồng má | 0–320 | phồng má 1,15, má đỏ dần | khói nhỏ từ mũi | — | — | "mmmf" |
| 2 Nhổ | 320–380 | giật đầu tới | cục dung nham rời miệng | — | — | "ptooey!" |
| 3 Bay | 380–720 | — | cục **sôi** (cuộn, sủi) bay **vồng cao 90**, tàn rơi theo, kéo giãn khi rơi | ngước | — | xèo |
| 4 Vỡ | 720 | — | dung nham **phụt / vỡ** thành 3 mảng + tàn | **nhảy nhót** ×2 | hit-stop light 50, rung 3 | "splorch" |
| 5 Dư âm | 720–1150 | idle | vết cháy, khói; `st_burn` | thổi chân | — | xèo |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | cục dung nham; vỡ | `fx_energy_orb` (đỏ cam, sôi), `fx_lava_pop` | `prop throw` arc 90 + `stretch` + `squashOnHit` 380–720 (cần `prop_flipbook` để cục sôi khi bay; tạm `fxs_ember` 3× + `pulse` + `glow`); `strip fx_lava_pop` 720 | 380–950 |
| L2 | má đỏ | — | `glow #ff4a1a tint` 0–320 | 0–320 |
| L3 | tàn rơi theo; 3 mảng; khói; vết | `fxs_ember` | `trail ember_trail every 60`; `burst ember_spray more 1.5` 720; `burst fire_smoke` 800; `decal scorch` 720 | 380–1150 |
| L4 | nhảy nhót; hit-stop | — | `move hop` ×2 target; `stop light`; `shake 3` | 720–1000 |
L1 đạt 3/3 (khi có `prop_flipbook`): biến hình (sôi, vỡ) · phụ sinh (tàn) · vận tốc (vồng, kéo giãn).

## 5. Asset
`fx_energy_orb` **mới** (dùng chung, tô dung nham); `fx_lava_pop`, `fxs_ember` có.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 phồng, giật đầu; mục tiêu nhảy · B3 cục dung nham → vỡ · B4 tàn, khói, vết · B5 hit-stop light (rung 5 → 3) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO` (khi có `prop_flipbook`); capture: khung ~550 cục ở **đỉnh vồng**, cao hơn đầu quái.
