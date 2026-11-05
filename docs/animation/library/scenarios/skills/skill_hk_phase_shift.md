# Kịch bản: Lệch Pha (`skill_hk_phase_shift`)

```json scenario
{
  "id": "skill_hk_phase_shift", "kind": "skill", "name": "Lệch Pha", "element": "SUPPORT", "tier": 0, "durationMs": 1250,
  "status": "draft", "refs": [], "bibles": ["elements/VOID", "actions/buff-and-heal"],
  "assets": [
    { "id": "fx_void_implode", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (nhỏ, lúc nhập lại)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Sứa **nhấp nháy hai lần**, **tách thành ba bóng lệch pha** (trái / phải / trên) bay vòng quanh vị trí, rồi **nhập lại "vwoop"**, hút sao xanh tím vào thân (hồi MP). Cảm giác: khó nắm bắt, lấp lánh. Né + 15 MP, T0.

## 2. Hiện tại
glow + shake + `trail` + wiggle + decal + sao. Audit: không cờ, không có hình chủ đạo — bóng mờ chỉ là trail đi theo khi lắc, không tách ra ba hướng.

## 3. Kịch bản theo nhịp
| # | ms | Sứa | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Nhấp | 0–300 | pose `cast`, **nhấp nháy** 2 lần (alpha 1 → 0,4 → 1) | viền tím | — | "wub-wub" |
| 2 Tách | 300–750 | thân mờ 0,5 | **ba bóng tím** tách ra trái / phải / trên, **bay vòng** quanh vị trí | — | ù lệch pha |
| 3 Nhập | 750 | thân rõ lại, bẹp nhẹ rồi bật | ba bóng **lao về tâm**, sụp nhỏ (implode), 8 sao xanh tím **bay vào** thân | — | "vwoop" |
| 4 Dư âm | 750–1250 | idle, viền tím nhạt | vòng loang tím nhỏ; `st_eva_up` | — | lấp lánh |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | ba bóng | thân sinh vật (bản sao bóng) | cần **afterimage tách hướng**: 3 `trail` với `move` lệch trái / phải / trên quỹ đạo tròn — nếu engine chưa có bản sao độc lập, dùng `move walk_sideways` + `trail every 40` nhanh + `move float` xen kẽ | 300–750 |
| L2 | viền tím; nhấp nháy | — | `glow #8c7cff` nhấp ×2 0–300 | 0–300 |
| L3 | sụp nhỏ; sao bay vào; vòng loang | `fx_void_implode` (0,6), `fxs_star` | `strip fx_void_implode frames [2,4]` 750; `burst star_pop tint #9ad0ff` hút vào 750; `decal ring #8c7cff` 750 | 750–1100 |
| L4 | bẹp / bật | — | `move squash 0.9` → `puff_up 1.05` (không rung) | 750–950 |
L1: thân + bóng là hình chủ đạo — đạt 2/3 (phụ sinh bóng, vận tốc tách / nhập).

## 5. Asset
`fx_void_implode` **mới**. Engine: bóng mờ tách hướng riêng là khả năng cần xác nhận khi dựng (ghi decision nếu thiếu).

## 6. Các bước dựng
B1 nhịp (giữ) · B2 nhấp nháy, mờ, bẹp / bật · B3 ba bóng · B4 sụp, sao, vòng · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~500 thấy **ba bóng ở ba phía** của sứa; khung ~800 sao đang bay vào thân.
