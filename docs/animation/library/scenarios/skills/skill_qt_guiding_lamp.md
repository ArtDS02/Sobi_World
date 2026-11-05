# Kịch bản: Đèn Dẫn Lối (`skill_qt_guiding_lamp`)

```json scenario
{
  "id": "skill_qt_guiding_lamp", "kind": "skill", "name": "Đèn Dẫn Lối", "element": "SUPPORT", "tier": 0, "durationMs": 1400,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/LIGHT"],
  "assets": [
    { "id": "fxp_mini_lantern", "state": "have", "layer": "L1" },
    { "id": "fx_buff_rise", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô vàng ấm)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Heo **tung một chùm sáng** tách thành **đèn lồng nhỏ** bay tới **đậu trên đầu** từng bạn, lắc lư; mỗi đèn **vạch đường chấm vàng** sang phe địch như chỉ đường ngắm, rồi rút về và **nhập vào thân**. Cảm giác: ấm áp, dẫn đường. Chính xác + Công phép tăng, T0.

## 2. Hiện tại
`fxp_mini_lantern throw` → `hover` + `tether`. Audit: `STATIC_HERO`, `STATIC_SHARE`. Đèn tĩnh, đường ngắm là tether liền chứ không chấm đứt, không nhập thân.

## 3. Kịch bản theo nhịp
| # | ms | Heo / đội | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Giơ | 0–300 | pose `cast`, giơ đèn | đèn sáng, chùm sáng bung lên | — | "fwip" |
| 2 Bay | 300–800 | — | chùm **tách** thành đèn nhỏ, bay vồng tới đầu từng bạn (stagger 120), **đung đưa** khi đậu (con lắc) | — | "pop" ×n |
| 3 Vạch | 800–1100 | đồng đội nhìn theo | mỗi đèn kéo **đường chấm vàng** sang phe địch rồi **rút lại** | — | chuông gió |
| 4 Nhập | 1100–1250 | bạn nhún, sáng lên | đèn **chìm vào thân**, cột sáng vàng mảnh vút lên | — | ngân |
| 5 Dư âm | 1250–1400 | idle | đốm sáng tan | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | đèn lồng | `fxp_mini_lantern` | `prop throw` arc 50 stagger 120 → `hover` + `wobble rot 12 freq 1.6` (đung đưa con lắc) 680–1100 → `grow` ngược + alpha (nhập thân) 1100–1250 | 300–1250 |
| L2 | ánh đèn; đường chấm | — | `glow #ffe98a` per ally; `tether wave 0 ref star_trail` (chấm đứt bằng hạt) 800–1100 | 0–1100 |
| L3 | sao từ chùm; cột buff; đốm tan | `fxs_star`, `fx_buff_rise` | `burst star_pop` 300; `strip fx_buff_rise` per ally 1100; `burst star_fall` 1250 | 300–1400 |
| L4 | đồng đội nhún | — | `move hop` per ally 1100 (không rung) | 1100–1300 |
L1 đạt 2/3: phụ sinh (đường chấm, ánh sáng) · vận tốc (đung đưa, nhập thân co lại). Biến hình: không cần (vật nhỏ, ngắn).

## 5. Asset
`fx_buff_rise` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp (giữ `{ 300, 800, 1400 }`) · B2 giơ, nhún · B3 đèn bay → đung đưa → nhập · B4 đường chấm, cột buff · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit: hình chủ đạo còn là ảnh tĩnh nhưng đạt 2/3 dấu hiệu — chấp nhận cho skill hỗ trợ nhỏ (ghi lý do vào review); capture: đèn ở các góc nghiêng khác nhau giữa 2 khung; khung ~950 thấy đường chấm sang phe địch.
