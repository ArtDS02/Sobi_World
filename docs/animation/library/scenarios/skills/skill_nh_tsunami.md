# Kịch bản: Sóng Thần Cổ (`skill_nh_tsunami`)

```json scenario
{
  "id": "skill_nh_tsunami", "kind": "skill", "name": "Sóng Thần Cổ", "element": "WATER", "tier": 2, "durationMs": 1650,
  "status": "built", "refs": ["REF-WATER-WAVE-001"], "bibles": ["elements/WATER", "actions/cast"],
  "assets": [
    { "id": "fx_wave_rise", "state": "have", "layer": "L1", "spec": "Flipbook 8 khung, mỗi khung 512×512, ghép ngang 4096×512, nền trong suốt, pivot giữa cạnh đáy, sóng hướng sang PHẢI. K1 mặt nước gợn thấp (cao 15% khung) · K2 nước dâng 35%, mép trên gợn · K3 vách dâng 60%, viền bọt trắng mỏng ở đỉnh · K4 vách cao 85%, đỉnh bắt đầu nghiêng sang phải · K5 đỉnh cuộn thành móc, bọt dày · K6 móc cuộn sâu, bọt tung lên, giọt rời khỏi đỉnh · K7 đổ sập xuống phía phải, tán bọt rộng · K8 vỡ thành mảng bọt thấp + giọt tan. Thân xanh #3fb2ff → bọt trắng #d8f4ff, viền nâu ấm mảnh, bóng mềm kiểu Sobi Farm, bo tròn như sticker; không tả thực." },
    { "id": "fxp_wave_crest", "state": "have", "layer": "L1" },
    { "id": "fx_splash", "state": "have", "layer": "L3" },
    { "id": "fxs_drop", "state": "have", "layer": "L3" },
    { "id": "fxs_bubble", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
Một bức sóng trồi lên **sau lưng đội mình**, dựng cao, **cuộn đỉnh** rồi **đổ sập** lên cả hàng quái, hất tung từng con. Người chơi phải cảm thấy: *khối nước nặng có đà*, không phải tấm hình trượt qua. Bậc T2 (power 1,3) nhưng diện rộng → lực vừa, độ hoành tráng đến từ kích thước và nhịp, không đến từ rung.
Nguồn ý tưởng: thiết kế gốc của chủ dự án ("bức sóng lớn trồi lên sau lưng đội, quét ngang hất tung cả hàng quái"), [REF-WATER-WAVE-001](../../refs/REF-WATER-WAVE-001.json), bible [WATER](../../bibles/elements/WATER.md).

## 2. Hiện tại
`fxp_wave_crest` (1 ảnh) `prop path: sweep` 900 ms + một `ribbon` sin + hạt. Capture `20261105-095545`: cùng một ảnh sóng ở các vị trí khác nhau, `shapeIoU 0,891` (cờ `STATIC_SHAPE`). Sóng không dâng, không cuộn, không vỡ → MUST-HAVE rubric "sóng tự cuộn, có bọt, giọt bắn, có quán tính khi đổ xuống" chỉ đạt bằng lớp phụ. Audit: `STATIC_HERO`, `STATIC_SHARE`, `DURATION_OVER` (1780 ms).

## 3. Kịch bản theo nhịp
| # | ms | Người dùng (cá) | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Chuẩn bị | 0–380 | pose `cast`, quẫy đuôi 2 nhịp, nén người | nước gom dưới chân (`fx_splash` nhỏ, `under`), giọt hút về | đứng | nền tối 12 %, gió ngược (`streak`) | nước cuộn trầm |
| 2 Dâng | 380–700 | giữ pose, thân sáng lam | **sóng dâng sau đội**: `fx_wave_rise` K1→K4 tại mép trái | ngước nhìn (tilt −4°) | — | ào dâng lên |
| 3 Tiến | 700–1050 | lò xo về | sóng tiến sang phải (`fxp_wave_crest` + gợn displacement), đỉnh nghiêng dần, **giọt rơi khỏi đỉnh** suốt quãng | bị bóng sóng phủ (tint lam nhẹ) | — | gầm |
| 4 Đổ | 1050–1250 | — | tại từng quái, lệch 90 ms: `fx_wave_rise` K5→K8 đổ sập | nhấc 30 px + xoay 20° + đẩy theo hướng sóng | hit-stop 80 (medium), rung 5 dọc-ngang, punch 1,03 ở con đầu | "sploosh" mỗi con |
| 5 Dư âm | 1250–1650 | idle | mưa giọt parabol, bọt tan, vũng dưới chân quái, gợn nhỏ chạy ngược về | rơi bẹp 0,9 → bật lại; Chậm: `st_spd_down` nếu gắn | nền sáng lại | mưa lách tách |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 màn | tối nền 12 %; tint lam lên vùng phe địch khi sóng phủ | — | `tint field` vào 300 ms, ra 300 ms | 0–1650 |
| L1 thân | (a) sóng dâng tại chỗ · (b) sóng tiến · (c) sóng đổ tại từng quái | (a) `fx_wave_rise` K1–K4 · (b) `fxp_wave_crest` · (c) `fx_wave_rise` K5–K8 | (a) `strip frames [0,3]` hold 0 · (b) `prop sweep` ease inOutSine, **displacement gợn** (`prop_displace`), nghiêng 0 → 8° theo tiến độ · (c) `strip frames [4,7]` per target stagger 90 | a 380–700 · b 700–1050 · c 1050–1250 |
| L2 lõi | lõi sáng lam trên người dùng khi gồng; viền bọt sáng ở đỉnh sóng | — | `glow $color` 0–700; `ribbon foam` mảnh bám đỉnh khi tiến | 0–1050 |
| L3 hạt & vết | giọt rơi khỏi đỉnh; bọt tung khi đổ; mưa giọt; vũng | `fxs_drop`, `fxs_bubble`, `fx_splash` | `prop … trail drop_spray every 60`; `burst bubble_spray` lúc đổ; `burst drop_fall` 1250; `decal puddle` 1050–1650 | 700–1650 |
| L4 phản hồi | hit-stop, rung, punch; mục tiêu phản ứng | — | `stop medium` 1050; `shake 5 dir [1,0.4]`; `punch 1.03`; `move lift` + `knock` stagger 90 | 1050–1450 |
Hình chủ đạo L1 đạt **3/3** dấu hiệu sống: biến hình (flipbook dâng + đổ, displacement khi tiến) · phụ sinh từ vật (giọt rơi khỏi đỉnh) · theo vận tốc (nghiêng dần khi tiến).

## 5. Asset
| Asset | Lớp | Trạng thái | Ghi chú |
|---|---|---|---|
| `fx_wave_rise` | L1 | có (2026-11-05, sheet W1) | đặc tả ở đầu file; cũng dùng cho `skill_nh_tide_song` (thu nhỏ, chỉ K1–K4) và `skill_ult_trident` (K6–K8) |
| `fxp_wave_crest` | L1 | có | dùng cho nhịp tiến; cần khớp silhouette với K4–K5 của `fx_wave_rise` (artist dùng ảnh này làm tham chiếu dáng) |
| `fx_splash`, `fxs_drop`, `fxs_bubble` | L3 | có | |
Dự phòng khi chưa có `fx_wave_rise`: (a) dâng = `fxp_wave_crest` `path: rise` từ dưới đất lên + `burst drop_rise`; (c) đổ = `fx_splash` size 1,6 + `burst bubble_spray`. Khi chưa có `prop_displace`: nghiêng + `wobble` + trail giọt dày (vẫn đạt 2/3 dấu hiệu).

## 6. Các bước dựng
1. **B1 nhịp**: đặt `timing { release 700, impact 1050, end 1650 }`; dùng `marker` / `tint` làm placeholder để xem đúng 5 nhịp.
2. **B2 thân**: pose + `cast_coil` người dùng; mục tiêu `lift` + `knock` stagger 90; kiểm thứ tự trúng từ trái sang phải.
3. **B3 L1**: sóng dâng (dự phòng trước) → sóng tiến (nghiêng, wobble) → sóng đổ; khi có asset thì thay bằng `fx_wave_rise`.
4. **B4 L3**: trail giọt trên sóng, bọt khi đổ, mưa, vũng.
5. **B5 L4**: `stop medium`, `shake`, `punch` ở con đầu; kiểm `anim:audit` T2.
6. **B6 âm**: `adv_water_cast` → `adv_wave` → `adv_water_hit` theo stagger.
7. **B7**: `npm run anim:capture -- --only battle.skill.skill_nh_tsunami`, so với run cũ; cập nhật `status`.

## 6b. Đã dựng (pilot P2, 2026-11-05) — bản dự phòng + prop_displace
- `prop_displace` làm bằng **Phaser Rope** (`scene/battle/fxRipple.ts`, toán ở `ui/propMotion.ts → rippleOffsets`, act `prop` có `ripple: { amp, waves, speed }`): ảnh `fxp_wave_crest` uốn theo sóng chạy dọc thân, mạnh hơn ở mép trước. WebGL; không có thì vẽ ảnh thường.
- Script: chuẩn bị 0–380 → sóng tiến `sweep` ease `inQuad` 380–1280 có ripple `{ 0.035, 1, 1.2 }` + wobble + bob + trail giọt → đổ 1050 lệch 90 / quái (splash 0,7, bọt, nhấc + đẩy, hit-stop medium 80, rung 5, punch 1,03) → mưa giọt + vũng. Bỏ dải ribbon lớn (cắt ngang thân sóng, rối mắt); giữ ribbon mảnh cuối.
- Hiệu chỉnh sau capture đầu: ripple `{0.06, 1.5, 1.6}` + 16 điểm làm đỉnh sóng gãy khúc → `{0.035, 1, 1.2}` + 24 điểm; splash ở chân quái 1,6 → 0,7 (trông như cái xô).
- `fx_wave_rise` đã có (sheet W1 của chủ dự án, batch `art_inbox/.batch/adventure-20-wave/`; cắt bằng hộp ngang chung + chân từng ô thẳng một đường đất, bỏ vạch đất → dải 8 × 512²).

## 6c. Chọn hướng (2026-11-05): **lai** — flipbook ở chỗ đứng yên, ripple khi di chuyển
So capture: chỉ ripple (run `20261105-140604-438f80c-890186f5`, IoU 0,83) chỉ có một hình sóng trượt qua, không dâng không đổ. Bản lai (run `20261105-142538-fb87f0a-60ab3622`, IoU **0,837**) đủ 3 hình: sóng **dâng từ đất** sau đội → đỉnh sóng **uốn** tiến tới đàn quái → sóng **cuộn đổ** tại từng con. Chọn bản lai:
- Dâng: `strip fx_wave_rise frames [0,3]` tại `allyside`, `spot behind`, `size 1.5`, `under`, **`stand`** (mới: đáy dải đặt trên đường đất của đơn vị, không căn giữa), `y 6`, 380 ms, `dur 320 hold 160`.
- Tiến: `prop fxp_wave_crest sweep` **820 ms** (trước 900) để đỉnh tới quái đúng lúc đổ và tắt ~150 ms sau; `stretch` theo vận tốc + ripple như cũ.
- Đổ: `strip fx_wave_rise frames [4,7]` tại `targets`, `size 1.6`, 360 ms, lệch 90 / quái.
- Bài học: khi đỉnh sóng (ảnh tĩnh) còn chiếm khung sau va chạm thì IoU 0,875 → cờ `STATIC_SHAPE`; khi tắt quá sớm (700 ms) khung va chạm trống. Hình chủ đạo tĩnh phải **nhường chỗ** cho flipbook đúng nhịp đổi.

## 7. Nghiệm thu
- `anim:audit`: không `STATIC_HERO`, `DURATION_OVER`; bậc có T2–T3.
- Capture: `shapeIoU` < 0,85 (không `STATIC_SHAPE`); khung ~550 ms thấy sóng **thấp** ở mép trái, khung ~1000 ms thấy sóng **cao và nghiêng**, khung `impact+80` thấy bọt tung + quái đang bay lên; khung `end` có vũng + giọt rơi.
- Ba quái trúng lệch nhịp thấy được trên 3 khung liên tiếp.
- Không che thanh máu quá 1 khung; chế độ giảm chuyển động: chỉ còn số + âm + icon.
