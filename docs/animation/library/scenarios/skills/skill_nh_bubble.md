# Kịch bản: Bong Bóng Nước (`skill_nh_bubble`)

```json scenario
{
  "id": "skill_nh_bubble", "kind": "skill", "name": "Bong Bóng Nước", "element": "WATER", "tier": 2, "durationMs": 1150,
  "status": "draft", "refs": ["REF-WATER-BUBBLE-001"], "bibles": ["elements/WATER", "actions/projectile"],
  "assets": [
    { "id": "fxp_bubble_big", "state": "have", "layer": "L1" },
    { "id": "fx_bubble_pop", "state": "new", "layer": "L1", "spec": "Flipbook 6 khung, mỗi khung 256×256, ghép ngang 1536×256, nền trong suốt, pivot giữa khung. Cùng kiểu bong bóng với fxp_bubble_big (tròn trong, viền nâu ấm mảnh, một điểm sáng trên-trái). K1 bong bóng tròn căng · K2 bẹp ngang (rộng 120%, cao 80%) · K3 mặt bóng rách một vệt sáng · K4 vỡ thành vòng giọt tròn văng đều + màng mỏng · K5 vòng giọt rộng, giọt nhỏ dần · K6 vài giọt cuối + gợn tròn mờ. Không tia sắc (đó là Kim)." },
    { "id": "fx_splash", "state": "have", "layer": "L3" },
    { "id": "fxs_bubble", "state": "have", "layer": "L3" },
    { "id": "fxs_drop", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Một bong bóng to **phồng lên trước miệng**, bay vồng **nảy một lần** như bóng bãi biển, **trùm lấy** mục tiêu rồi "PLOP". Cảm giác: dễ thương, đàn hồi, có trọng lượng nước. T2.
Nguồn: thiết kế gốc của chủ dự án; [REF-WATER-BUBBLE-001](../../refs/REF-WATER-BUBBLE-001.json); bible [projectile](../../bibles/actions/projectile.md).

## 2. Hiện tại
`fxp_bubble_big` dùng 3 lần (`pop` → `throw` → `hover`), có `pulse` + `bobY` → vẫn là một ảnh tròn trượt và phồng xẹp; vỡ bằng `fx_splash` 4 khung dùng chung. Audit: `STATIC_HERO`, `STATIC_SHARE`. Bóng không bẹp khi chạm, không có giọt rơi khi bay.

## 3. Kịch bản theo nhịp
| # | ms | Người dùng | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Chuẩn bị | 0–300 | pose `cast`, phồng má 2 lần (sx 1,1 / sy 0,92) | 3 bọt nhỏ nổi từ miệng; bóng phồng 0,2 → 1,1 → 1,0 (overshoot) ở `front` | đứng | — | "blub-blub" |
| 2 Bắn | 300–360 | giật lùi 12 px | bóng rời miệng, kéo giãn theo hướng bay | — | — | "pop" nhẹ |
| 3 Bay | 360–720 | lò xo về | bay vồng 60 px, **chạm đất giữa sân nảy lần 2** (bẹp 0,8 khi chạm), xoay chậm, giọt rơi khỏi đáy | ngước nhìn | — | "boing" |
| 4 Trùm | 720–860 | — | bóng phình to 1,6 trùm mục tiêu, trong suốt 70 % | nổi lên 12 px trong bóng, mặt `hurt` | — | "bloop" |
| 5 Vỡ | 860 | — | `fx_bubble_pop` K1→K6 tại thân mục tiêu | rơi bẹp 0,9 | hit-stop 60 (light), rung 3 | "PLOP!" |
| 6 Dư âm | 860–1150 | idle | vòng giọt + vũng nhỏ + 3–5 bọt nhỏ bay lên tan | bật lại; Ướt `st_wet` | — | giọt lách tách |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | — | — | — | — |
| L1 | bóng phồng → bay nảy → trùm → vỡ | `fxp_bubble_big`, `fx_bubble_pop` | `prop pop` (outBack) 0–300 · `prop throw` arc 60 + `stretch` + `squashOnHit` 360–720 (nảy: hai `throw` nối nhau, cái thứ hai arc 30) · `prop hover` size 1,6 alpha 0,7 720–860 · `strip fx_bubble_pop` 860 | 0–1050 |
| L2 | điểm sáng phản chiếu trên bóng (có trong ảnh); `glow` lam nhẹ trên má khi phồng | — | `glow $color` 0–300 | 0–300 |
| L3 | bọt từ miệng; giọt rơi khỏi đáy khi bay; vòng giọt khi vỡ; vũng | `fxs_bubble`, `fxs_drop`, `fx_splash` | `burst bubble_rise` 0; `trail drop_trail every 70` trên `prop throw`; `burst drop_ring` 860; `decal puddle` 860–1150 | 0–1150 |
| L4 | hit-stop, rung; mục tiêu nổi rồi rơi | — | `stop light` 860; `shake 3`; `move float y 12` 720–860 → `squash 0.9` 900 | 720–1150 |
L1 đạt 3/3: biến hình (vỡ 6 khung, bẹp khi nảy) · phụ sinh (giọt rơi khi bay) · vận tốc (`stretch` / `squashOnHit`).

## 5. Asset
| Asset | Lớp | Trạng thái | Ghi chú |
|---|---|---|---|
| `fx_bubble_pop` | L1 | **mới** | dùng chung: `skill_e_bubble`, `skill_nh_soothe` (giọt chạm), status `wet` expire |
| `fxp_bubble_big` | L1 | có | |
| `fx_splash`, `fxs_bubble`, `fxs_drop` | L3 | có | |
Dự phòng: chưa có `fx_bubble_pop` → `fx_splash` + `burst drop_ring` + `burst bubble_pop` (giữ như hiện tại).

## 6. Các bước dựng
1. B1 nhịp: `timing { release 300, impact 860, end 1150 }`.
2. B2 thân: phồng má (`move puff_up` × 2), giật lùi, mục tiêu nổi / rơi.
3. B3 L1: phồng → bay (thêm nhịp nảy giữa sân) → trùm → vỡ.
4. B4 L3: bọt miệng, trail giọt, vòng giọt, vũng.
5. B5 L4: `stop light`, `shake 3`.
6. B6 âm: blub → boing → PLOP (`adv_water_cast`, `adv_water_hit`).
7. B7 capture + audit.

## 7. Nghiệm thu
- `anim:audit` không `STATIC_HERO` (khi có `fx_bubble_pop`), không `NO_AFTERMATH`.
- Capture: khung giữa đường bay thấy bóng **bẹp** ở điểm nảy; khung 760–820 thấy mục tiêu **nằm trong bóng**; khung 900 thấy vòng giọt (không phải sao chung).
- Tổng ≤ 1150 ms; không chặn thanh máu khi bóng trùm (alpha ≤ 0,7).
