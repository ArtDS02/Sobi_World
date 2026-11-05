# Kịch bản: Mai Núi (`skill_qs_mountain_shell`)

```json scenario
{
  "id": "skill_qs_mountain_shell", "kind": "skill", "name": "Mai Núi", "element": "SUPPORT", "tier": 0, "durationMs": 1500,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/EARTH"],
  "assets": [
    { "id": "fxp_mountain_trio", "state": "have", "layer": "L1" },
    { "id": "fxp_stone_plate", "state": "have", "layer": "L1" },
    { "id": "fx_crack_spread", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô nâu, nứt ngang sau phe ta)" },
    { "id": "fx_buff_rise", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô vàng đất)" },
    { "id": "fxs_pebble", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
**Ba ngọn núi trồi sau đội**, rồi **thu nhỏ thành mai đá** bay đáp lên lưng từng bạn — mỗi con **khuỵu nhẹ như đeo ba lô nặng** rồi đứng thẳng. Cảm giác: vững chãi, hài hước nhẹ. Thủ + thủ phép cả đội, T0.

## 2. Hiện tại
`fxp_mountain_trio rise` + `fxp_stone_plate fall` + squash. Audit: `STATIC_HERO`, `STATIC_SHARE`. Núi trồi một khối, không có bụi, không có "thu nhỏ thành mai".

## 3. Kịch bản theo nhịp
| # | ms | Rùa / đội | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Dậm | 0–350 | rùa dậm 1 nhịp | đất nứt ngang sau phe ta | rung 2 | "bum" |
| 2 Trồi | 350–900 | — | 3 núi **trồi chậm** từ mép dưới, đất vụn rơi khỏi sườn, tuyết đỉnh lóe ở 850 | rung nhẹ liên tục 1 | ầm núi |
| 3 Thu nhỏ | 900–1000 | — | núi **co lại** (scale 1 → 0,2) và **tách** thành phiến đá | — | "whoom" |
| 4 Đáp | 1000–1300 | mỗi bạn khuỵu (sy 0,9) rồi bật | phiến bay vòng đáp lên lưng từng bạn, lệch 110 | — | "bonk" ×n |
| 5 Dư âm | 1300–1500 | đứng thẳng | cột sáng vàng mảnh vút lên mỗi bạn; `st_def_up` + `st_mdef_up` | — | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | núi; phiến | `fxp_mountain_trio`, `fxp_stone_plate` | `prop rise` ease outQuad + `prop_displace` nhẹ (sườn núi rung) 350–900 → `grow` ngược (scale ↓) 900–1000 → `prop fly` tới lưng từng bạn stagger 110 + `squashOnHit` | 350–1300 |
| L2 | lóe tuyết đỉnh | — | `burst star_pop` tại đỉnh 850 | 850 |
| L3 | nứt sau đội; đất vụn; cột buff | `fx_crack_spread`, `fxs_pebble`, `fx_buff_rise` | `strip fx_crack_spread under` 0; `burst pebble_fall` 400–850; `strip fx_buff_rise` per ally 1300 | 0–1500 |
| L4 | đồng đội khuỵu → bật | — | `move squash 0.9` stagger 110 → `puff_up 1.04`; rung 1–2 (T0) | 1000–1400 |
L1 đạt 3/3: biến hình (núi co + tách; rung sườn) · phụ sinh (đất vụn) · vận tốc (phiến bay + bẹp khi đáp).

## 5. Asset
`fx_crack_spread`, `fx_buff_rise` **mới**; còn lại có. Dự phòng: `decal crack`, `burst buff_arrows`; chưa có displacement → `move shake` nhỏ trên prop không có → bỏ rung sườn.

## 6. Các bước dựng
B1 nhịp `{ release 900, impact 1000, end 1500 }` · B2 dậm, đội khuỵu / bật · B3 núi → co → phiến · B4 nứt, đất vụn, cột buff · B5 rung ≤ 2 · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`, không `IMPACT_OVER_TIER`; capture: khung ~950 núi đang co lại; mỗi đồng đội có khung khuỵu riêng (lệch nhịp).
