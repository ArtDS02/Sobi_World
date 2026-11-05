# Kịch bản: Ngắm Chuẩn (`skill_cl_aim`) — lớp Chiến Binh

```json scenario
{
  "id": "skill_cl_aim", "kind": "skill", "name": "Ngắm Chuẩn", "element": "SUPPORT", "tier": 0, "durationMs": 950,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fxp_crosshair", "state": "have", "layer": "L1" },
    { "id": "fx_buff_rise", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô đỏ cam)" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Nheo một mắt**, nghiêng đầu; **tâm ngắm** hiện trên phe địch, **co từ to về nhỏ**, **lướt qua từng quái** rồi **khóa "ting"**; tâm bay về thu nhỏ vào mắt, thân **gồng**. Cảm giác: tập trung, chính xác. Chính xác + Công, T0.

## 2. Hiện tại
`fxp_crosshair` hiện / co. Audit: `STATIC_HERO`, `STATIC_SHARE`.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Nheo | 0–250 | nheo mắt, nghiêng đầu 6° | — | "hmm…" |
| 2 Lướt | 250–600 | giữ | tâm ngắm **co 1,6 → 0,8** và **lướt** qua quái 1 → 2 → 3 (dừng ngắn ở mỗi con), xoay chậm | tick ×3 |
| 3 Khóa | 600–650 | — | tâm **co phắt** 0,6, lóe đỏ | "ting!" |
| 4 Về | 650–950 | **gồng**, phồng 1,05 | tâm bay về, thu nhỏ vào mắt; cột sáng đỏ cam mảnh | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | tâm ngắm | `fxp_crosshair` | `prop pop` 250 → `prop sweep` qua foeside (ease theo bậc, dừng 80 ở mỗi con) + `spin 0.3` + co dần; lóe 600; `prop fly` về mắt + co 650–850 | 250–850 |
| L2 | lóe đỏ khi khóa | — | `glow #ff4a4a` 600 | 600–650 |
| L3 | cột buff | `fx_buff_rise` | `strip` 700 | 700–950 |
| L4 | nheo / gồng | — | `move tilt deg 6`; `move puff_up 1.05` 650 (không rung) | 0–900 |
L1 đạt 2/3: vận tốc (lướt có dừng, co) · biến hình nhẹ (co / xoay). Vật nhỏ — chấp nhận.

## 5. Asset
`fx_buff_rise` **mới**.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 nheo, gồng · B3 tâm ngắm lướt → khóa → về · B4 cột buff · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: tâm ngắm ở **ba quái khác nhau** trong 3 khung pha 2; khung ~620 tâm **nhỏ nhất**.
