# Kịch bản trạng thái: Khiêu khích (`taunt`)

```json scenario
{
  "id": "taunt", "kind": "status", "name": "Khiêu khích", "element": "NONE", "tier": 0, "durationMs": 500,
  "status": "draft", "refs": [], "bibles": ["actions/status"],
  "assets": [
    { "id": "fxp_taunt_badge", "state": "have", "layer": "L1" },
    { "id": "fxs_note", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Huy hiệu đỏ bật** trên đầu, quái **quay nhìn**; khi còn hiệu lực huy hiệu nhỏ **lắc** mỗi 1,8 s, mắt quái thỉnh thoảng **liếc** về con này; hết: huy hiệu **xì hơi** xẹp xuống. Cảm giác: chọc tức, vui.

## 2. Hiện tại
apply: decal + badge pop + quái nhìn + phồng; layers orbit **`fxp_curse_eye`** (mắt nguyền — sai nhận diện: đó là hình của Lời Nguyền); expire: poof + decal + khói.

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| Dính | 0–500 | ưỡn ngực | huy hiệu **bật** 0 → 1,3 → 1,0; quái quay nhìn | "ding!" |
| Duy trì | mỗi 1,8 s | — | huy hiệu nhỏ trên đầu **lắc** (wobble); 1 nốt nhạc chọc tức bay lên | không |
| Hết | 300–450 | xìu vai | huy hiệu **xì hơi** (co + rơi xuống), poof nhỏ | "pfff" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | huy hiệu | `fxp_taunt_badge` | apply `pop`; layer: **thay** `orbit fxp_curse_eye` bằng `hover fxp_taunt_badge` nhỏ (0,25) + `wobble` nhịp; expire `fall` ngắn + co |
| L3 | nốt nhạc | `fxs_note` | loop `burst note_pop` |
| L4 | ưỡn / xìu; quái nhìn | — | `move puff_up` / `squash`; `move look` foes (giữ) |

## 5. Asset
Đủ. Sửa: bỏ `fxp_curse_eye` khỏi layer của taunt (trùng hình với `skill_e_curse`).

## 6. Các bước dựng
B1 apply ≤ 500 · B2 ưỡn / xìu · B3 huy hiệu hover thay mắt nguyền · B4 nốt · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture loop: thấy **huy hiệu** (không phải mắt) trên đầu; không trùng chữ ký với `skill_e_curse`.
