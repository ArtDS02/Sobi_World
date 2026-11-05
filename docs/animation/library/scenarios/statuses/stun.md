# Kịch bản trạng thái: Choáng (`stun`)

```json scenario
{
  "id": "stun", "kind": "status", "name": "Choáng", "element": "NONE", "tier": 0, "durationMs": 500,
  "status": "draft", "refs": [], "bibles": ["actions/status", "actions/idle-and-states"],
  "assets": [
    { "id": "fx_spark_arc", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (chỉ khi choáng do Sấm, tô vàng)" },
    { "id": "fxs_star", "state": "have", "layer": "L1" },
    { "id": "fxs_feather", "state": "have", "layer": "L1" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Rubric MUST-HAVE: **"sao / chim xoay quanh đầu + biểu cảm choáng"**. Lúc dính thân **lảo đảo** (mắt xoắn = pose `hurt`), **3 sao vàng + 1 chim nhỏ** bay vòng quanh đầu; khi còn hiệu lực thân **lắc lư chậm như say**; hết: lắc đầu **tỉnh lại** "tinh!".

## 2. Hiện tại
apply: sao + wiggle + âm; layers: orbit sao + spark; expire: poof + `fx_pow_star` + sao. Có sao xoay, **không** có biểu cảm choáng kéo dài, không lắc lư khi duy trì; `actions.stunned` (lượt bị mất) có pose `hurt`.

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| Dính | 0–500 | **lảo đảo** (tilt ±8° 2 nhịp), pose `hurt` | sao + chim **bung ra** rồi xếp vào quỹ đạo quanh đầu | "ding-ding" |
| Duy trì | liên tục | **lắc lư chậm** (tilt ±3°, 1,6 s/chu kỳ), mắt xoắn khi có pose | 3 sao + 1 chim **xoay** quanh đầu (elip, lệch pha) | không |
| Lượt bị mất (`stunned`) | 700 | ngồi phịch, lắc đầu | sao xoay nhanh hơn | "uuu~" |
| Hết | 300–450 | **lắc đầu mạnh** 2 cái rồi đứng thẳng | sao bay tán ra rồi tan | "tinh!" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | sao + chim quỹ đạo | `fxs_star` ×3, `fxs_feather` (làm chim nhỏ) | status `layers: orbit` (giữ sao, thêm chim lệch pha 120°) |
| L3 | hồ quang (choáng do Sấm) | `fx_spark_arc` | chỉ khi nguồn Sấm (phản ứng `reaction_shock`) |
| L4 | lảo đảo; lắc lư; lắc đầu | — | `move tilt` nhịp; idle thêm sway khi có status (cần cờ status `sway` — ghi engine nếu thiếu) |

## 5. Asset
`fx_spark_arc` **mới** (tùy nguồn); sao, lông có.

## 6. Các bước dựng
B1 apply ≤ 500 · B2 lảo đảo; sway khi duy trì · B3 quỹ đạo sao + chim · B4 tán ra khi hết · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture loop: sao + chim ở **vị trí khác** giữa khung; thân nghiêng khác nhau (sway); expire thấy sao **tán ra**.
