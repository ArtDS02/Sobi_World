# Kịch bản: Đinh Ba Hải Vương (`skill_ult_trident`) — tuyệt kỹ

```json scenario
{
  "id": "skill_ult_trident", "kind": "skill", "name": "Đinh Ba Hải Vương", "element": "WATER", "tier": 4, "durationMs": 3200,
  "status": "draft", "refs": ["REF-WATER-WAVE-001"], "bibles": ["actions/ultimate", "elements/WATER"],
  "assets": [
    { "id": "fxp_trident", "state": "have", "layer": "L1" },
    { "id": "fx_water_column", "state": "new", "layer": "L1", "spec": "Xem skill_ult_nh (dùng chung). Ở skill này phát đủ K1–K6 dưới chân từng quái, size 1,4." },
    { "id": "fx_wave_rise", "state": "have", "layer": "L3", "spec": "Xem skill_nh_tsunami (dùng chung). Ở skill này phát K1–K3 nhỏ quanh chân đinh ba (nước dâng khi cắm)." },
    { "id": "fx_splash", "state": "have", "layer": "L3" },
    { "id": "fxs_drop", "state": "have", "layer": "L3" }
  ],
  "engine": ["bg_scene"]
}
```

## 1. Ý tưởng
**Đinh ba khổng lồ cắm xuống giữa sân**, nước dâng quanh chân; **ba mũi lần lượt sáng**, mỗi mũi gọi **một cột nước** vọt lên dưới quái, tung chúng lên trời rồi rơi "splat". Cảm giác: uy lực biển cả, nhịp 1-2-**3** (cột thứ ba mạnh nhất). Tuyệt kỹ T4 (power 2,2), Ướt + 30 % Choáng.
Nguồn: thiết kế gốc; bible [ultimate](../../bibles/actions/ultimate.md) §2 (khoảng lặng trước nhịp cuối). Đinh ba ở dạng chung (thần thoại phổ thông), không theo thiết kế của IP nào.

## 2. Hiện tại
`fxp_trident path: fall` cắm xuống, rồi `fx_splash` 4 khung tại mục tiêu + nhấc + hạt mưa. Audit: `STATIC_HERO` (`shapeIoU 0,993` — đinh ba là ảnh đứng yên suốt 2,2 s), `STATIC_SHARE`; L2 đã thêm. Không có "ba mũi sáng lần lượt", không có cột nước.

## 3. Kịch bản theo nhịp
| # | ms | Người dùng | Hiệu ứng chính | Địch | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Intro | 0–500 | `cast_coil`, lõi lam sáng | cut-in xanh biển | — | letterbox; nền **biển bão** (`bg_scene`) | sấm xa |
| 2 Cắm | 500–1000 | vung tay xuống | đinh ba rơi xoáy từ trên, có **bóng báo** (`shadow`), cắm giữa sân 900: **bẹp/nảy** nhẹ, nước dâng quanh chân (`fx_wave_rise` K1–K3 nhỏ) | giật mình | rung 6 ở 900 | "KRAANG" + ào |
| 3 Mũi 1 | 1100–1350 | — | mũi trái sáng (glow nhấp) → cột nước dưới quái 1 | tung lên 40 px xoay | hit-stop light, rung 4 | "GLORP" |
| 4 Mũi 2 | 1450–1700 | — | mũi giữa sáng → cột dưới quái 2 | tung | hit-stop light, rung 5 | "GLORP" |
| 5 Lặng | 1700–1800 | — | **khoảng lặng**: đinh ba rung, cả ba mũi sáng | — | sân gần đứng yên | im |
| 6 Mũi 3 | 1800–2250 | — | mũi phải sáng chói → cột **to nhất** dưới quái 3 (hơn 3 quái: cột sau đánh 2 con) | tung cao, xoay | **hit-stop ultimate**, punch 1,06, rung 8, chớp lam 0,35 | "GLORP!!" |
| 7 Rơi | 2250–2700 | — | quái rơi "splat", vũng; Ướt `st_wet`, Choáng `st_stun` nếu gắn | bẹp rồi bật | — | splat ×3 |
| 8 Outro | 2700–3200 | idle | đinh ba **chìm** xuống nước (wipe từ dưới lên), mưa giọt thưa | — | nền trở lại, letterbox rút | mưa nhỏ |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | letterbox, biển bão, vignette | — | `bg_scene` (dự phòng `tint #0a1830 0.4`) | 0–3200 |
| L1 | đinh ba; 3 cột nước | `fxp_trident`, `fx_water_column` | `prop fall` + `shadow` + `squashOnHit` 500–900 → đứng tới 2700 với `wobble` nhỏ lúc lặng → `prop` chìm (path `rise` ngược / alpha) 2700–3100; `strip fx_water_column` size 1,4 tại từng quái (1100, 1450, 1800; cái thứ ba size 1,7) | 500–3100 |
| L2 | lõi người dùng; **mũi đinh ba sáng lần lượt** | — | `glow $color` actor 0–700; `marker` / `glow` tại từng mũi (cần vị trí mũi trên ảnh: ghi `spot` lệch x ±) | 0–2250 |
| L3 | nước dâng quanh chân; mưa giọt; vũng | `fx_wave_rise` K1–K3, `fxs_drop`, `fx_splash` | `strip` 900; `burst drop_fall` thưa suốt; `decal puddle` foes stagger | 900–3200 |
| L4 | hit-stop tăng dần, rung, punch, chớp | — | `stop light` 1100, 1450 → `stop ultimate` 1800; `shake 6/4/5/8`; `punch 1.06` 1800; `flash 0.35` 1800 | 900–2300 |
L1 đạt 3/3: biến hình (cột nước 6 khung) · phụ sinh (nước dâng quanh chân đinh ba) · vận tốc (bẹp khi cắm, rung lúc lặng).

## 5. Asset
| Asset | Lớp | Trạng thái |
|---|---|---|
| `fx_water_column` | L1 | **mới** (chung với `skill_ult_nh`) |
| `fx_wave_rise` | L3 | có (2026-11-05, chung với `skill_nh_tsunami`) |
| `fxp_trident`, `fx_splash`, `fxs_drop` | | có |
Dự phòng: chưa có `fx_water_column` → `fx_splash` size 2 + `burst drop_rise` dày + `move lift` cao (hiện tại). Chưa có `bg_scene` → tint.

## 6. Các bước dựng
1. B1 nhịp `{ release 900, impact 1100, end 3200 }`; đặt 3 nhịp + khoảng lặng bằng `marker`. 2. B2 thân: quái tung lên theo stagger 350 (không phải 90 — ba nhịp rõ). 3. B3 L1: cắm (bóng báo, bẹp) → cột nước ×3 → chìm. 4. B4 L3. 5. B5 L4: hit-stop tăng dần, lặng trước nhịp 3. 6. B6 âm. 7. B7 capture.

## 7. Nghiệm thu
- `anim:audit`: không `STATIC_HERO`, `FEW_LAYERS`.
- Capture: 3 khung impact khác nhau (1100, 1450, 1800) mỗi khung một cột nước ở một quái; khung 1750 sân gần như đứng yên; cột thứ ba to hơn hai cột đầu; khung 3000 đinh ba đã chìm một phần.
- Rubric ultimate ≥ 90 ở C3 (chờ playtest C5).

## Hợp đồng nhìn thấy (bản 3D, 2026-11-12, `trident_sea`)
```
Skill: skill_ult_trident — Đinh Ba Hải Vương   Hệ: NƯỚC   Bậc: T4   Đích: mọi kẻ địch   Kết thúc: 3200 ms
descVi: "Tuyệt kỹ: đinh ba triệu sóng đánh mọi kẻ địch, làm Ướt và 30% làm choáng."
PHẢI THẤY:
  1. Cut-in xanh nước (2D có sẵn); ba dải nước xoắn từ đất lên một xoáy nước trên trời, giọt nước bị hút vào.
  2. Trong xoáy, nước kết thành MỘT cây đinh ba bằng nước (thân xanh, viền trắng), to hơn ba lần một chiến binh, bật ra có nảy.
  3. Đinh ba khựng lại lấy đà rồi RƠI nhanh dần, vệt sáng kéo theo; cắm xuống giữa hàng địch đúng 1100 ms, thân lún và rung.
  4. Vương miện nước và một cột nước vọt lên ở chỗ cắm; giọt bắn tung thành vệt.
  5. BA bức sóng có mào bọt lan ra, bức sau cao và xa hơn bức trước; khi bức đầu tới mỗi kẻ địch, con đó có cột nước RIÊNG (lệch ≥ 110 ms).
  6. Dư âm: tấm nước có viền bọt loang trên đất, gợn sóng, mưa rơi lại, sương bốc.
KHÔNG ĐƯỢC: vẽ choáng (trạng thái lo); vẽ Ướt thành vụ nổ riêng; nước cháy trắng che mất quái.
NHỊP (ms từ đầu act): Tụ 0–560 · Hình thành 280–580 · Lấy đà 560–760 · Rơi 760–1100 · IMPACT 1100 (hit-stop ultimate ở 1300 theo kịch bản cũ) · Sóng 1160–2700 · Dư âm 1750–3000
HÌNH CHỦ ĐẠO: cây đinh ba nước — biến hình (nảy khi sinh, kéo dài khi rơi, lún khi cắm) + hạt sinh từ chính nó (vương miện, cột nước)
KIỂM: −550 thấy xoáy và dải nước; −250 thấy đinh ba hoàn chỉnh; +150 vương miện + cột nước; +700 ≥ 2 bức sóng; +1100 cột nước ở kẻ địch; +1600 tấm nước và gợn. FPS ≥ 50 trên RTX 3050.
```
