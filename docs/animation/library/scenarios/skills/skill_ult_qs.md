# Kịch bản: Núi Thiêng Trỗi Dậy (`skill_ult_qs`) — tuyệt kỹ

```json scenario
{
  "id": "skill_ult_qs", "kind": "skill", "name": "Núi Thiêng Trỗi Dậy", "element": "SUPPORT", "tier": 4, "durationMs": 3300,
  "status": "draft", "refs": [], "bibles": ["actions/ultimate", "actions/buff-and-heal", "elements/EARTH"],
  "assets": [
    { "id": "fxp_turtle_mountain", "state": "have", "layer": "L1" },
    { "id": "fxp_stone_plate", "state": "have", "layer": "L1" },
    { "id": "fxp_taunt_badge", "state": "have", "layer": "L1" },
    { "id": "fx_crack_spread", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô nâu, nứt lớn sau phe ta)" },
    { "id": "fx_shield_form", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô vàng đất)" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_pebble", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace", "bg_scene"]
}
```

## 1. Ý tưởng
**Mai rùa cổ mang núi trồi lên** sau đội (chậm, rung liên tục), **bắn phiến đá** dựng thành **lũy khiên** trước từng bạn; rồi rùa **bước lên gầm thách thức**, mọi quái quay nhìn. Cảm giác: cổ kính, khổng lồ, che chở. Tuyệt kỹ hỗ trợ (khiên 30 % cả đội + Khiêu khích 2 lượt).

## 2. Hiện tại
Khung tuyệt kỹ đủ; `fxp_turtle_mountain rise` 2,75 s (một ảnh đứng yên sau khi trồi), phiến bay, `fx_shield_dome`, taunt badge. Audit: `STATIC_HERO`, `STATIC_SHARE`, `NO_PREPARATION` (do intro dùng `punch` lúc 0 — audit coi là va chạm; đã thêm `cast_coil`).

## 3. Kịch bản theo nhịp
| # | ms | Rùa | Hiệu ứng chính | Đội / quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Intro | 0–500 | `cast_coil`, mai sáng vàng | cut-in nâu vàng | — | letterbox; nền **hoàng hôn trên núi** | gong mở |
| 2 Trồi | 500–1450 | gồng | **nứt lớn** sau phe ta → núi-rùa **trồi chậm**, sườn núi rung, đá vụn rơi khỏi thân; bụi vòng | — | rung 4 liên tục | địa chấn dài |
| 3 Lũy | 1450–2250 | — | núi **bắn phiến đá** bay tới trước từng bạn (stagger 150), phiến **ghép thành khiên** lục giác vàng đất | mỗi bạn đứng vững (puff_up) | hit-stop ultimate ở phiến cuối 1850 | "GONG" đá |
| 4 Gầm | 2250–2850 | bước lên, phồng 1,15, gầm | huy hiệu thách thức bật trên đầu, sóng âm tỏa | **mọi quái quay nhìn** rùa | rung 3 | rùa gầm trầm |
| 5 Outro | 2850–3300 | idle | núi **chìm** xuống, khiên còn viền sáng | — | nền trở lại, letterbox rút | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | letterbox, nền núi | — | `bg_scene` (dự phòng `tint #ff9a5a 0.2`) | 0–3300 |
| L1 | nứt; núi-rùa; phiến; khiên; huy hiệu | `fx_crack_spread`, `fxp_turtle_mountain`, `fxp_stone_plate`, `fx_shield_form`, `fxp_taunt_badge` | nứt 500; `prop rise` chậm ease outQuad + `prop_displace` (rung sườn) 500–1450, đứng + `bobY` nhỏ, chìm 2850–3200; `prop fly` phiến stagger 150 + `squashOnHit`; `strip fx_shield_form` per ally; `prop pop` badge 2300 | 500–3200 |
| L2 | mai sáng; viền khiên | — | `glow $color` actor 500–1200; khiên K5 sóng sáng | 500–2300 |
| L3 | đá vụn rơi; bụi vòng; sóng âm | `fxs_pebble`, `fx_dust_ring` | `burst pebble_fall` 600–1400 thưa; `strip fx_dust_ring` 600, 1000; `burst note_ring` tại actor 2300 | 500–2850 |
| L4 | rung liên tục; hit-stop; quái quay nhìn | — | `shake 4` 500–1450; `stop ultimate` 1850; `punch 1.05`; `move look` foes 2300 | 500–2850 |
L1 đạt 3/3: biến hình (nứt + khiên ghép khung, rung sườn) · phụ sinh (đá vụn) · vận tốc (phiến bay bẹp).

## 5. Asset
`fx_crack_spread`, `fx_shield_form`, `fx_dust_ring` **mới**; còn lại có. Dự phòng: `decal crack`, `fx_shield_dome`, `burst earth_dust`.

## 6. Các bước dựng
B1 nhịp `{ release 600, impact 1450, end 3300 }`, bỏ `punch` lúc 0 (dùng `vignette`) để intro không bị coi là va chạm · B2 gồng, gầm, quái quay nhìn · B3 nứt → núi → phiến → khiên → badge → chìm · B4 vụn, bụi, sóng âm · B5 rung liên tục, hit-stop · B6 âm · B7 capture (suite ultimates).

## 7. Nghiệm thu
Audit hết `STATIC_HERO`, `NO_PREPARATION`; capture: khung ~1000 núi trồi **một nửa** có đá vụn; khung ~2000 khiên trước từng bạn; khung ~2500 quái quay về phía rùa; khung cuối núi đã chìm.
