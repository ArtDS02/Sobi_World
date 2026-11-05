# Kịch bản: Phá Giáp (`skill_tg_armor_break`)

```json scenario
{
  "id": "skill_tg_armor_break", "kind": "skill", "name": "Phá Giáp", "element": "METAL", "tier": 2, "durationMs": 1100,
  "status": "draft", "refs": [], "bibles": ["elements/METAL", "actions/projectile"],
  "assets": [
    { "id": "fxs_metal_bit", "state": "have", "layer": "L1" },
    { "id": "fx_crack_spread", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô trắng-bạc, đặt ở ngực, xoay đứng làm vết nứt chữ Y trên giáp)" },
    { "id": "fx_metal_spark", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_debuff_sink", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Đinh tán bắn thẳng như phi tiêu**, **ghim vào giáp** ngực "tink" — **khựng** — rồi **vết nứt chữ Y sáng lan** và giáp **bung mảnh**. Cảm giác: chính xác, "pchew → tink → KRSH", hai nhịp tác động. T2 (power 0,9), Giảm thủ 80 %.

## 2. Hiện tại
`tether` + `fx_ground_crack` + `fx_pow_star`, hit-stop 100. Audit: dư âm đã thêm; hình chủ đạo là tether (đường thẳng), không có đinh tán bay, không có hai nhịp ghim → vỡ.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Ngắm | 0–280 | pose `cast`, cúi đầu, mũ sắt **lóe** | — | — | — | "kchk" |
| 2 Bắn | 280–560 | giật lùi 10 | đinh tán bay **thẳng**, xoay quanh trục, kéo giãn, vệt mảnh | — | — | "pchew" |
| 3 Ghim | 560 | — | đinh **cắm vào ngực**, đứng yên rung | giật nhẹ | hit-stop light 60 | "tink" |
| 4 Nứt | 560–700 | — | **vết nứt chữ Y** sáng lan từ đinh trên giáp | — | — | "krrr" |
| 5 Vỡ | 700 | — | giáp **bung** 10 mảnh kim + lóe chữ thập | bật lùi 16 | hit-stop medium 70, rung 4, chớp 0,1 | "KRSH" |
| 6 Dư âm | 700–1100 | idle | mảnh rơi leng keng; khói xám chảy xuống thân → `st_def_down` | co người | — | leng keng |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | đinh tán; vết nứt | `fxs_metal_bit` size 0,3, `fx_crack_spread` (trắng, ở ngực) | `prop fly` linear + `stretch` + `spin 3` 280–560 → `hover` + `wobble` 560–700; `strip fx_crack_spread` 560–700 | 280–750 |
| L2 | lóe mũ; vệt đinh | — | `glow #ffffff` 200–280; `trail` mảnh | 200–560 |
| L3 | lóe chữ thập + mảnh; khói xuống | `fx_metal_spark`, `fx_debuff_sink` | `strip fx_metal_spark` 700; `burst metal_spray` 700; `burst metal_fall` 800; `strip fx_debuff_sink` 850 | 700–1100 |
| L4 | hai nhịp hit-stop | — | `stop light` 560; `stop medium` 700; `shake 4`; `move knock x 16` | 560–900 |
L1 đạt 3/3: biến hình (nứt lan) · phụ sinh (mảnh từ giáp) · vận tốc (kéo giãn, rung khi ghim).

## 5. Asset
`fx_crack_spread`, `fx_metal_spark`, `fx_debuff_sink` **mới**; dự phòng `fx_ground_crack` nhỏ tô trắng, `burst metal_pop`, `burst debuff_smoke`.

## 6. Các bước dựng
B1 nhịp `{ release 280, impact 700, end 1100 }` (số sát thương ở nhịp vỡ) · B2 ngắm, giật lùi; mục tiêu giật → bật · B3 đinh bay → ghim → nứt · B4 mảnh, khói · B5 hai nhịp hit-stop · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~620 đinh **cắm ở ngực**, chưa vỡ; khung ~760 mảnh bung; hai hit-stop đo được trong manifest.
