# Kịch bản: Bão Phép (`skill_cl_spell_storm`) — lớp Pháp Sư

```json scenario
{
  "id": "skill_cl_spell_storm", "kind": "skill", "name": "Bão Phép", "element": "SELF", "tier": 1, "durationMs": 1600,
  "status": "draft", "refs": [], "bibles": ["actions/cast"],
  "assets": [
    { "id": "fx_wind_swirl", "state": "have", "layer": "L1" },
    { "id": "fx_hit_burst", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô theo hệ, size 0,5)" },
    { "id": "fx_debuff_sink", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Ba vòng phép nhỏ** quay quanh người, **bay lên** trên phe địch, **xoáy lại thành cơn bão phép**; bão **phóng tia lung tung** xuống các quái; bão tan, từng trạng thái xấu hiện riêng. Cảm giác: hỗn loạn có kiểm soát, "zap ×6". T1 diện rộng (power 0,7), 3 debuff 50 %.

## 2. Hiện tại
`fx_wind_swirl` + beam, dư âm đã thêm. Audit: không cờ, nhưng vòng phép không bay lên, tia không ngẫu nhiên rõ.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Vòng | 0–400 | pose `cast` | 3 vòng phép nhỏ **quay quanh người** | — | — | ù |
| 2 Bay lên | 400–800 | ngửa tay | 3 vòng **bay lên** trên phe địch, **xoáy** vào nhau thành 2 xoáy bão theo hệ | ngước | tối 15 % | gió xoáy |
| 3 Tia | 800–1400 | giữ | 6 tia mảnh **phóng ngẫu nhiên** (có seed) xuống các quái, lệch 100 | giật mỗi lần trúng | hit-stop light 40 lần đầu, rung 2 liên tục | "zap" ×6 |
| 4 Tan | 1400–1600 | hạ tay | bão tan thành hạt; khói xám chảy xuống từng quái bị dính | — | nền về | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | vòng phép → xoáy bão | vòng (`decal rune` nhỏ quay quanh actor), `fx_wind_swirl` ($color) ×2 | vòng: 3 `marker`/`decal` quay 0–400 → bay lên (cần prop: dùng `fxs_rune_a` `prop orbit` → `fly` lên `sky`); `strip fx_wind_swirl hold 600` ×2 ở `sky` foeside 700–1400 | 0–1450 |
| L2 | 6 tia | beam code | `beam` từ xoáy xuống target, 6 act lệch 100, `width 3` | 800–1400 |
| L3 | va chạm nhỏ; khói debuff | `fx_hit_burst` (0,5), `fx_debuff_sink` | `strip` mỗi tia; `strip fx_debuff_sink` per target bị dính 1400 | 800–1600 |
| L4 | rung nhẹ liên tục; giật | — | `shake 2` 800–1400; `stop light` 800; `move shake` targets | 800–1400 |
L1 đạt 2/3: biến hình (xoáy khung) · phụ sinh (tia từ bão).

## 5. Asset
`fx_hit_burst`, `fx_debuff_sink` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp `{ release 400, impact 800, end 1600 }` (rút 150) · B2 cast, ngửa tay; quái giật · B3 vòng → bay lên → bão · B4 tia, va chạm, khói · B5 hit-stop light, rung 2 · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~600 vòng phép **đang bay lên** giữa sân; 6 tia trúng các quái theo thứ tự không đều.
