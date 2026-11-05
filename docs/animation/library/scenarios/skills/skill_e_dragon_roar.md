# Kịch bản: Tiếng Gầm Rồng (`skill_e_dragon_roar`) — quái Rồng Dung Nham

```json scenario
{
  "id": "skill_e_dragon_roar", "kind": "skill", "name": "Tiếng Gầm Rồng", "element": "SUPPORT", "tier": 0, "durationMs": 1400,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/FIRE"],
  "assets": [
    { "id": "fxp_dragon_roar", "state": "have", "layer": "L1" },
    { "id": "fx_buff_rise", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô đỏ)" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
Rồng **ngẩng cao, hít**, rồi **GẦM**: một **đầu rồng bằng khí nóng** (méo không khí) **lan qua bầy**, cả bầy **sáng đỏ, hừng hực**. Cảm giác: uy quyền, nóng. Công cả đội (+ Công phép bản thân), T0 (rung đã hạ 6 → 2).

## 2. Hiện tại
`fxp_dragon_roar sweep` (ảnh tĩnh). Audit: `STATIC_HERO`, `STATIC_SHARE`.

## 3. Kịch bản theo nhịp
| # | ms | Rồng / bầy | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Hít | 0–350 | ngẩng cao, ngực phồng | khói bốc từ mũi | — | hít |
| 2 Gầm | 350–850 | **mở miệng gầm**, thân rung | **đầu rồng khí nóng** lan qua bầy, **méo không khí** (displacement), mờ dần khi đi xa | rung 2 | "ROOOAR" |
| 3 Hừng hực | 850 | bầy **sáng đỏ**, phồng | cột sáng đỏ mỗi con | — | — |
| 4 Dư âm | 850–1400 | idle | hơi nóng bốc lên (gợn) rồi tan; `st_atk_up` | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | đầu rồng khí nóng | `fxp_dragon_roar` (alpha 0,6) | `prop sweep` qua allyside + `prop_displace` mạnh + `grow` nhẹ + alpha giảm 350–850 | 350–900 |
| L2 | bầy sáng đỏ | — | `glow #ff4a1a tint` per ally stagger 80 | 850–1100 |
| L3 | khói mũi; cột buff | `fx_buff_rise` | `burst puff_rise` 100; `strip fx_buff_rise` per ally 850 | 100–1400 |
| L4 | rung thân khi gầm; bầy phồng | — | `move shake x 2 n 6` actor; `shake 2` (đã hạ); `move puff_up 1.05` bầy | 350–1100 |
L1 đạt 2/3 (khi có displacement): biến hình (méo khí) · vận tốc (lan, mờ dần).

## 5. Asset
`fx_buff_rise` **mới**; `fxp_dragon_roar` có.

## 6. Các bước dựng
B1 nhịp `{ release 350, impact 850, end 1400 }` · B2 hít, gầm rung; bầy phồng · B3 đầu rồng khí · B4 khói, cột · B5 rung ≤ 2 · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO` (khi có displacement), không `IMPACT_OVER_TIER`; capture: đầu rồng **mờ dần** theo quãng.
