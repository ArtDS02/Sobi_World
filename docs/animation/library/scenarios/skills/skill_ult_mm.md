# Kịch bản: Rừng Mẹ Ôm Ấp (`skill_ult_mm`) — tuyệt kỹ

```json scenario
{
  "id": "skill_ult_mm", "kind": "skill", "name": "Rừng Mẹ Ôm Ấp", "element": "SUPPORT", "tier": 4, "durationMs": 3400,
  "status": "draft", "refs": [], "bibles": ["actions/ultimate", "actions/buff-and-heal", "elements/NATURE", "motifs/poison"],
  "assets": [
    { "id": "fxp_mother_tree", "state": "have", "layer": "L1" },
    { "id": "fx_vine_grow", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (rễ chạy sang phe địch)" },
    { "id": "fx_bloom_open", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (hoa nở trên tán: hồng; hoa độc dưới quái: tím)" },
    { "id": "fx_heal_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_petal", "state": "have", "layer": "L3" },
    { "id": "fxs_spore", "state": "have", "layer": "L3" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace", "bg_scene"]
}
```

## 1. Ý tưởng
**Cây mẹ khổng lồ mọc** sau đội, tán **phủ nửa màn trên, lá rung trong gió**; **hoa nở trên tán**, **mưa hoa** chữa lành cả đội; rồi **rễ lan sang** phe địch, **trồi lên phun bào tử độc**. Cảm giác: che chở dịu dàng nhưng có gai. Tuyệt kỹ hỗ trợ: hồi 30 % + Hồi phục cả đội, Độc phe địch.

## 2. Hiện tại
`fxp_mother_tree rise` 2,3 s (ảnh tĩnh), cánh hoa rơi, `fx_vine_grab`, bào tử, hit-stop ultimate. Audit: `STATIC_HERO`, `STATIC_SHARE`. Tán không rung, hoa không nở, rễ không chạy.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Đội / quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Intro | 0–500 | `cast_bow` | cut-in xanh lá | — | letterbox; nền **rừng nắng** | chuông gỗ |
| 2 Mọc | 500–1300 | gồng | cây **mọc chậm** sau đội, **tán lá rung** (displacement), lá bay ra | — | — | gió lá |
| 3 Nở hoa | 1300–1500 | — | hoa **nở lần lượt** trên tán | — | — | hợp âm nở |
| 4 Mưa hoa | 1500–2200 | — | 40 cánh hoa **rơi chao** lên phe ta; vòng hồi nở ở chân từng bạn (stagger 120) | hồi máu, nhún; `st_regen` | hit-stop ultimate 1500 (D-1) | mưa chuông |
| 5 Rễ lan | 2200–2500 | — | **rễ chạy** từ gốc cây dưới đất sang phe địch | giật mình | — | "shrrk" |
| 6 Độc | 2500–2850 | — | rễ trồi + **hoa độc nở** dưới từng quái (stagger 120), **phun bào tử** | ho, tint tím; `st_poison` | rung 3 | "pff" ×n |
| 7 Outro | 2850–3400 | idle | cây **thu nhỏ** rút xuống, để lại hoa cỏ nhỏ | — | nền về, letterbox rút | gió dịu |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền rừng nắng; letterbox | — | `bg_scene` (dự phòng `tint #9ad870 0.2`) | 0–3400 |
| L1 | cây; rễ | `fxp_mother_tree`, `fx_vine_grow` | `prop rise` chậm ease outQuad + `prop_displace` (tán rung) + `wobble rot 1.5` 500–2850, thu nhỏ + chìm 2850–3300; `strip fx_vine_grow under` từ gốc sang phe địch 2200–2500 | 500–3300 |
| L2 | lõi người dùng; ánh nắng qua tán | — | `glow $color`; `ribbon` mỏng vàng (tia nắng) 1100–2000 | 0–2000 |
| L3 | lá bay; hoa nở trên tán; mưa hoa; vòng hồi; hoa độc; bào tử | `fxs_leaf`, `fx_bloom_open`, `fxs_petal`, `fx_heal_bloom`, `fxs_spore` | `burst leaf_pop` 600–1200; `strip fx_bloom_open` ×4 trên tán 1300 (lệch 50); `burst petal_fall` 1500–2200; `strip fx_heal_bloom` per ally; `strip fx_bloom_open tint tím` per foe 2500; `burst spore_pop` per foe | 600–3000 |
| L4 | hit-stop (D-1); quái ho | — | `stop ultimate` 1500; `punch 1.04`; `shake 3` 2500; `move shake` foes | 1500–2900 |
L1 đạt 3/3: biến hình (tán rung, rễ mọc khung) · phụ sinh (lá, hoa, bào tử) · vận tốc (mọc / thu nhỏ có ease).

## 5. Asset
`fx_vine_grow`, `fx_bloom_open`, `fx_heal_bloom` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 gồng; đội nhún; quái ho · B3 cây → hoa → rễ → hoa độc → thu nhỏ · B4 lá, mưa hoa, bào tử · B5 hit-stop · B6 âm · B7 capture (ultimates).

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: tán cây **đổi hình** giữa 2 khung (rung); khung ~1800 cánh hoa trên phe ta; khung ~2350 rễ **đang chạy** giữa sân; khung ~2700 hoa tím dưới quái.
