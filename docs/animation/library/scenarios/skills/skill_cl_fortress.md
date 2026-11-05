# Kịch bản: Pháo Đài Sống (`skill_cl_fortress`) — lớp Hộ Vệ

```json scenario
{
  "id": "skill_cl_fortress", "kind": "skill", "name": "Pháo Đài Sống", "element": "SUPPORT", "tier": 0, "durationMs": 1400,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/EARTH"],
  "assets": [
    { "id": "fxp_fortress", "state": "have", "layer": "L1" },
    { "id": "fxp_stone_plate", "state": "have", "layer": "L1" },
    { "id": "fx_shield_form", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Heo **dang chân đứng vững**; **bốn khối đá rơi lần lượt** "bonk" xếp thành **pháo đài tí hon** quanh người; **cờ bung phấp phới**; quái quay nhìn. Cảm giác: lắp ráp vui nhộn, vững chãi. Khiêu khích + Thủ + Thủ phép + khiên 25 %, T0.

## 2. Hiện tại
`fxp_fortress` một ảnh + khiên + quái nhìn; rung đã hạ còn 2. Audit: `STATIC_HERO`, `STATIC_SHARE`, `DURATION_OVER` (1450).

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái | Âm thanh |
|---|---|---|---|---|---|
| 1 Đứng vững | 0–300 | dang chân, hạ thấp | — | — | "hup" |
| 2 Xếp đá | 300–700 | giật nhẹ mỗi khối | 4 khối đá **rơi lần lượt** (100 ms/khối) quanh heo, bẹp khi chạm, bụi nhỏ | — | "bonk" ×4 (rung 1) |
| 3 Pháo đài | 700–850 | — | các khối **ghép** thành pháo đài (ảnh pháo đài pop thay các khối), **cờ bung** (lắc) | — | kèn nhỏ |
| 4 Thách | 850–1100 | ưỡn ngực | khiên mỏng ghép quanh | **quay nhìn** | "ding" |
| 5 Dư âm | 1100–1400 | idle | pháo đài mờ thành viền; `st_taunt`, `st_def_up`, `st_mdef_up`, `st_shield` | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | 4 khối; pháo đài + cờ | `fxp_stone_plate` ×4, `fxp_fortress` | `prop fall` + `squashOnHit` stagger 100 (vị trí quanh heo) 300–700; `prop pop` pháo đài + `wobble rot 3` (cờ) 700–1100 → alpha | 300–1350 |
| L3 | bụi mỗi khối; khiên | `fx_dust_ring` (nhỏ), `fx_shield_form` | `strip fx_dust_ring size 0.4` ×4; `strip fx_shield_form` 850 | 300–1100 |
| L4 | giật mỗi khối; quái quay | — | `move squash 0.97` ×4; `shake 1` ×4 (T0); `move look` foes 850 | 300–1100 |
L1 đạt 2/3: vận tốc (rơi bẹp, cờ lắc) · phụ sinh (bụi). Ghép từ nhiều khối thay cho biến hình.

## 5. Asset
`fx_shield_form`, `fx_dust_ring` **mới**; dự phòng `fx_shield_dome`, `burst slam_dust`.

## 6. Các bước dựng
B1 nhịp `{ release 300, impact 850, end 1400 }` · B2 đứng vững, giật, ưỡn; quái quay · B3 khối → pháo đài → cờ · B4 bụi, khiên · B5 rung ≤ 1 · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_OVER`, `IMPACT_OVER_TIER`; capture: khung ~550 thấy **2–3 khối đã xếp, 1 khối đang rơi**.
