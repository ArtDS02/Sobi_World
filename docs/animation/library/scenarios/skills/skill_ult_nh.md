# Kịch bản: Tiếng Hát Đại Dương (`skill_ult_nh`) — tuyệt kỹ

```json scenario
{
  "id": "skill_ult_nh", "kind": "skill", "name": "Tiếng Hát Đại Dương", "element": "SUPPORT", "tier": 4, "durationMs": 3300,
  "status": "draft", "refs": [], "bibles": ["actions/ultimate", "actions/buff-and-heal", "elements/WATER"],
  "assets": [
    { "id": "fxp_whale", "state": "have", "layer": "L1" },
    { "id": "fxp_rainbow", "state": "have", "layer": "L1" },
    { "id": "fx_water_column", "state": "new", "layer": "L1", "spec": "Flipbook 6 khung, mỗi khung 256×512 (dọc), ghép ngang 1536×512, nền trong suốt, pivot giữa cạnh đáy. K1 mặt nước gợn tròn nhỏ · K2 cột nước vọt lên 40% chiều cao · K3 cột cao 85%, thân xoắn nhẹ, bọt ở đỉnh · K4 đỉnh nở thành hoa nước, giọt văng · K5 cột sụp xuống 50%, giọt rơi · K6 vũng bọt thấp + giọt cuối. Xanh #3fb2ff → bọt trắng, viền nâu ấm mảnh, kiểu Sobi. Dùng lật ngược (K4–K6) làm vòi phun của cá voi." },
    { "id": "fx_splash", "state": "have", "layer": "L3" },
    { "id": "fxs_bubble", "state": "have", "layer": "L3" },
    { "id": "fxs_drop", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace", "bg_scene"]
}
```

## 1. Ý tưởng
**Cá voi khổng lồ bơi ngang bầu trời**: hát → **mưa sáng** hồi máu cả đội và cuốn trôi trạng thái xấu → **quẫy đuôi** tạt nước ướt sũng phe địch. Cảm giác: bao la, dịu dàng nhưng choáng ngợp — đây là màn trình diễn. Tuyệt kỹ hỗ trợ (hồi 40 %, xóa mọi trạng thái xấu, địch bị Ướt); giữ hit-stop ở nhịp tạt (D-1).
Nguồn: thiết kế gốc; bible [ultimate](../../bibles/actions/ultimate.md).

## 2. Hiện tại
Có đủ khung tuyệt kỹ (letterbox, cut-in, tint, slowmo, hit-stop, outro) nhưng `fxp_whale` là **một ảnh trượt ngang 2,4 s** (`sweep`): không vẫy đuôi, không phun nước, không hát. Audit: `STATIC_HERO`, `STATIC_SHARE`, `FEW_LAYERS` (đã thêm L2 glow 2026-11-05).

## 3. Kịch bản theo nhịp
| # | ms | Người dùng | Hiệu ứng chính | Đồng đội / địch | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Intro | 0–500 | `cast_bow`, sáng ngọc | cut-in xanh ngọc tên chiêu | — | letterbox; nền đổi **biển sâu** (`bg_scene`), 20 bọt nổi khắp màn | hợp âm mở |
| 2 Cá voi tới | 500–1300 | hát | cá voi bơi vào từ mép trái trên cao (to nửa màn), **thân gợn** (displacement), nhấp nhô; **phun vòi** (`fx_water_column` lật ngược) ở 900 | ngước nhìn | slowmo 0,8 lúc phun | tiếng cá voi hát dài |
| 3 Mưa hồi | 1300–2200 | hát | vòi rơi thành **mưa sáng** trên phe ta, lệch 150 mỗi bạn | nhún, số hồi; icon xấu bị cuốn thành bọt | — | mưa êm + chuông |
| 4 Tạt | 2200–2750 | — | cá voi tới trên phe địch, **quẫy đuôi** (thân nghiêng 15°, displacement mạnh), mỗi quái một `fx_splash` 1,4× đổ ụp | quái ướt sũng lắc người, `st_wet` | hit-stop ultimate ở cú tạt cuối 2650; rung 4 → 7 | "SPLOOSH" |
| 5 Outro | 2750–3300 | idle | cá voi bơi khuất bên phải; **cầu vồng** mờ hiện ra rồi tan; bọt | — | nền trở lại, letterbox rút | ngân kết |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | letterbox, nền biển sâu, vignette | — | `letterbox`, `bg_scene` (dự phòng: `tint #0a2a4a 0.35`), `vignette` | 0–3300 |
| L1 | cá voi; vòi phun; cầu vồng | `fxp_whale`, `fx_water_column`, `fxp_rainbow` | `prop sweep` cao, ease inOutSine, `bobY amp 10 freq 0.8`, **displacement gợn thân** (mạnh lên lúc quẫy), nghiêng 0 → 15° lúc 2200–2450 rồi về; `strip fx_water_column frames [3,5] flip` tại lưng cá voi 900; `prop grow fxp_rainbow` 2750 | 500–3300 |
| L2 | lõi ngọc trên người dùng; vệt bọt sau đuôi cá voi | — | `glow $color` 0–700; `trail` bọt trên prop | 0–2750 |
| L3 | bọt nổi; mưa sáng; bọt từ icon xấu; splash trên quái; vũng | `fxs_bubble`, `fxs_drop`, `fx_splash` | `burst bubble_rise` field 0; `burst drop_fall` allies stagger 150; `burst bubble_pop` per ally; `strip fx_splash size 1.4` per foe stagger 120; `decal puddle` foes | 0–3300 |
| L4 | slowmo, hit-stop, rung, punch | — | `slowmo 0.8` 900–1200; `stop ultimate` 2650; `shake 4` 2200, `shake 7` 2650; `punch 1.05` 2630 | 900–2900 |
L1 đạt 3/3: biến hình (displacement + vòi phun khung) · phụ sinh (vòi → mưa, vệt bọt) · vận tốc (nghiêng khi quẫy).

## 5. Asset
| Asset | Lớp | Trạng thái | Ghi chú |
|---|---|---|---|
| `fx_water_column` | L1 | **mới** | chung với `skill_ult_trident` |
| `fxp_whale`, `fxp_rainbow` | L1 | có | cá voi cần displacement để "bơi"; nếu sau này tách ảnh thân / đuôi thì đuôi vẫy thật (không cần ngay) |
| `fx_splash`, `fxs_bubble`, `fxs_drop` | L3 | có | |
Dự phòng: chưa có `bg_scene` → `tint` xanh đậm; chưa có displacement → `wobble rot 4 freq 0.6` + `bobY`.

## 6. Các bước dựng
1. B1 nhịp `{ release 500, impact 1300, end 3300 }` (giữ). 2. B2 thân: hát, đồng đội nhún lệch nhịp, quái lắc. 3. B3 L1: cá voi (displacement, nghiêng khi quẫy) → vòi phun → cầu vồng. 4. B4 L3: mưa, bọt, splash. 5. B5 L4: slowmo, hit-stop, rung tăng dần. 6. B6 âm. 7. B7 capture (suite ultimates).

## 7. Nghiệm thu
- `anim:audit`: không `STATIC_HERO`, `FEW_LAYERS`.
- Capture: `shapeIoU` < 0,85; khung ~950 thấy vòi phun; ~1600 thấy mưa trên phe ta; ~2500 cá voi **nghiêng** trên phe địch; ~3100 cầu vồng; khung cuối nền đã trở lại.
- Rubric ultimate: đủ MUST-HAVE; ≤ 3,5 s; bỏ qua được.
