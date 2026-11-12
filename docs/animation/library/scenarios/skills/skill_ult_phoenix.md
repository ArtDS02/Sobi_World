# Kịch bản: Phượng Hoàng Tái Sinh (`skill_ult_phoenix`) — tuyệt kỹ

```json scenario
{
  "id": "skill_ult_phoenix", "kind": "skill", "name": "Phượng Hoàng Tái Sinh", "element": "FIRE", "tier": 4, "durationMs": 3400,
  "status": "draft", "refs": [], "bibles": ["actions/ultimate", "elements/FIRE"],
  "assets": [
    { "id": "fxp_phoenix", "state": "have", "layer": "L1" },
    { "id": "fx_flame_loop", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (lớp lửa phủ theo thân chim)" },
    { "id": "fx_fire_blast", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_feather_fire", "state": "have", "layer": "L3" },
    { "id": "fxs_ember", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace", "prop_flipbook", "bg_scene"]
}
```

## 1. Ý tưởng
Người dùng **bùng lửa**, **phượng hoàng lửa** bay ra lượn **một vòng lớn** trên sân, **khép cánh thành kén sáng** trên cao, rồi **lao quét** phe địch; xong **bay ngược** qua phe ta **rắc lông vũ hồi sinh**, tan thành tàn lửa. Cảm giác: rực rỡ, thiêng, tái sinh. Tuyệt kỹ T4: Bỏng địch + Tự hồi sinh cho đội. (Phượng hoàng ở dạng chung của thần thoại phổ thông — decision 048.)

## 2. Hiện tại
`fxp_phoenix` dùng 6 lần (`orbit`, `fly` ×2, `sweep` ×2, `grow`) — cùng một ảnh tĩnh di chuyển; có đủ L2 (duy nhất trong 12 ultimate). Audit: `STATIC_HERO`, `STATIC_SHARE`. Chim không đập cánh, không cháy.

## 3. Kịch bản theo nhịp
| # | ms | Người dùng | Hiệu ứng chính | Quái / đội | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Intro | 0–500 | `cast_roar` | cut-in cam đỏ | — | letterbox; nền **hoàng hôn rực** | phượng kêu |
| 2 Bùng | 500–700 | **bùng lửa** quanh thân | lửa bốc thành hình chim | — | — | "FWOOM" |
| 3 Lượn | 700–1300 | idle sáng | chim bay **vòng lớn** trên sân, **thân cháy liên tục**, cánh **vỗ** (scale y nhịp 0,85 ↔ 1,05), rơi lông lửa | ngước | — | vỗ cánh |
| 4 Kén | 1300–1500 | — | chim **khép cánh** (co + sáng chói) thành kén trên cao | — | lặng | ngân cao |
| 5 Lao | 1500–1900 | — | **lao quét** phe địch kéo vệt lửa; nổ lửa từng quái (stagger 90) | bật lùi; `st_burn` | hit-stop ultimate 1700, punch 1,05, rung 9 | "FWOOSH" |
| 6 Rắc lông | 2300–2900 | đón | chim bay **ngược lên** qua phe ta, **rắc lông vũ vàng** lên từng bạn → `st_revive` | đội sáng lên | chớp ấm 0,2 | chuông vàng |
| 7 Tan | 2900–3400 | idle | chim **tan thành tàn lửa** bay lên | — | nền về, letterbox rút | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền hoàng hôn; letterbox | — | `bg_scene` (dự phòng `tint #ff7a3a 0.3`) | 0–3400 |
| L1 | chim + lửa phủ thân | `fxp_phoenix`, `fx_flame_loop` | `prop orbit` 700–1300 + `pulse` trục y (vỗ cánh, `freq 3`) + `prop_displace` (lửa cháy); co + sáng 1300–1500; `prop sweep` + `stretch` 1500–1900; `prop fly` ngược lên 2300–2900; tan (alpha + `grow`) 2900–3300. Lửa phủ cần `prop_flipbook` (hoặc displacement) | 700–3300 |
| L2 | lõi người dùng; kén sáng; vệt lửa khi lao | — | `glow` actor 500–1000; `glow` kén; `trail` cam khi lao | 500–1900 |
| L3 | lông lửa rơi; nổ lửa; lông vàng; tàn | `fxs_feather_fire`, `fx_fire_blast`, `fxs_ember` | `burst firefeather_fall` 700–1300; `strip fx_fire_blast` per target stagger 90; `burst feather_fall` vàng per ally 2300–2900; `burst ember_rise` 2900 | 700–3400 |
| L4 | hit-stop, rung; đội sáng | — | `stop ultimate` 1700; `punch 1.05`; `shake 9`; chớp chỉ ở 1700 và 2500 (≤ 0,4) | 1500–2600 |
L1 đạt 3/3: biến hình (vỗ cánh + lửa phủ) · phụ sinh (lông, tàn) · vận tốc (lao kéo giãn, khép cánh).

## 5. Asset
`fx_flame_loop`, `fx_fire_blast` **mới**; còn lại có. Lý tưởng lâu dài: ảnh chim 2 pose cánh (giương / khép) để luân phiên — ghi vào ASSET_TODO khi chủ dự án muốn.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 bùng lửa; quái bật; đội sáng · B3 chim lượn (vỗ) → kén → lao → rắc lông → tan · B4 lông, nổ, tàn · B5 hit-stop, giảm chớp (có 2 chớp ở 2500 + 1700, rung 12 → 9) · B6 âm · B7 capture (ultimates).

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: `shapeIoU` < 0,85 (vỗ cánh + lửa); khung ~1400 chim **co sáng**; khung ~2600 lông vàng rơi trên phe ta.

## Hợp đồng nhìn thấy (bản 3D, 2026-11-12, `phoenix_rebirth`)
```
Skill: skill_ult_phoenix — Phượng Hoàng Tái Sinh   Hệ: LỬA   Bậc: T4   Đích: mọi kẻ địch + cả đội   Kết thúc: 3400 ms
descVi: "Tuyệt kỹ: lửa phượng hoàng đánh mọi kẻ địch và gây Bỏng, cả đội nhận Bất khuất."
PHẢI THẤY:
  1. Tàn lửa xoáy tụ thành một nụ lửa trên đầu người tung (0–450).
  2. Nụ lửa nổ, một con PHƯỢNG HOÀNG bung cánh (cánh lông vũ nhiều lớp, cổ cong, mào, đuôi dài có "mắt lửa"), khựng lại giơ cánh.
  3. Chim cụp cánh LAO đầu xuống hàng địch, kéo vệt lửa; chạm đúng 1300 ms.
  4. Hàng địch bốc lửa: MỖI kẻ địch một ngọn lửa riêng (lệch 90 ms), một ngọn lớn ở giữa, vòng lửa trên đất, tia lửa bắn vệt, vết cháy.
  5. TÁI SINH (1750–2650): từ đám lửa, phượng hoàng lớn (sải cánh khoảng 1/3 màn) vươn lên, cánh đang cụp bật XÒE ra ở 2050 kèm vòng sáng và chớp; lông vũ vàng bay ra.
  6. Phượng hoàng tan lên thành ánh sáng; trên MỖI đồng đội một ngọn lửa vàng dựng lên, vòng sáng mở, sao bay lên (Bất khuất, hiệu quả chắc chắn).
KHÔNG ĐƯỢC: chim chỉ là quầng sáng cộng màu (phải có thân sơn màu, đọc được trên nền sáng); khói che thân chim; chớp mạnh quá 2 lần / giây.
NHỊP: Tụ 0–450 · Bung cánh 420–750 · Lấy đà 700–860 · Lao 860–1300 · IMPACT 1300 + hit-stop ultimate · Lửa 1300–2550 · Tái sinh 1750–2650 (xòe 2050) · Ban phúc 2450–3350
HÌNH CHỦ ĐẠO: con phượng hoàng — biến hình (cánh mở / cụp / uốn, đuôi bay) + hạt sinh từ chính nó (lửa trên cánh, lông vũ)
KIỂM: −650 chim bung cánh trên người tung; −200 chim đang lao có vệt; +500 lửa ở từng kẻ địch; +1000 phượng hoàng lớn đã xòe cánh; +1600 lửa vàng trên đồng đội. FPS ≥ 50.
```
