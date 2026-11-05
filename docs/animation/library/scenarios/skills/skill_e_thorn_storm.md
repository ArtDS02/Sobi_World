# Kịch bản: Bão Gai (`skill_e_thorn_storm`) — trùm Cổ Thụ (dưới 50 % máu)

```json scenario
{
  "id": "skill_e_thorn_storm", "kind": "skill", "name": "Bão Gai", "element": "NATURE", "tier": 2, "durationMs": 1800,
  "status": "draft", "refs": [], "bibles": ["elements/NATURE", "actions/idle-and-states"],
  "assets": [
    { "id": "fxs_thorn", "state": "have", "layer": "L1" },
    { "id": "fx_hit_burst", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô xanh, size 0,4)" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Trùm cây **gầm**, **lá đổi đỏ cam**; **vòng gai quay quanh thân như cối xay**, nhanh dần; rồi **bắn quạt gai** quét ngang cả đội — mỗi con trúng ba gai. Cảm giác: trùm nổi giận, áp lực tăng dần. T2 diện rộng (power 1,3). Rung đã hạ còn 4.

## 2. Hiện tại
`fxs_thorn` quay + bắn, 2000 ms. Audit: `STATIC_HERO`, `DURATION_OVER`.

## 3. Kịch bản theo nhịp
| # | ms | Trùm | Hiệu ứng chính | Phe ta | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Gầm | 0–500 | ngửa thân gầm, **lá đổi đỏ cam** (tint dần) | lá rơi | — | tối 20 % | gầm gỗ |
| 2 Cối xay | 500–950 | rung | 24 gai **quay quanh thân**, **nhanh dần**, bán kính nở ra | lùi nửa bước | — | "vrrrr" tăng |
| 3 Quạt | 950–1400 | giật mỗi đợt | gai **bắn quạt** quét trái → phải phe ta, 3 đợt (stagger 120) | mỗi con giật ×3 | hit-stop light 40 ×2, medium 70 đợt 3, rung 2/2/4 | "thk-thk-thk" |
| 4 Dư âm | 1400–1800 | thở | gai **cắm xuống đất** rồi tan; lá đỏ rơi | — | nền về | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | tối nền | — | `tint 0.2` | 0–1700 |
| L1 | gai cối xay; gai bắn | `fxs_thorn` | 8 `prop orbit` quanh actor (thay 24 cho nhẹ; dùng `burst thorn_ring` bổ sung), tốc độ `spin` tăng 500–950 → `prop throw` / `fly` + `stretch` sang targets theo quạt, 3 đợt | 500–1400 |
| L2 | thân trùm đỏ dần | — | `glow #ff7a3a tint` 0–500 | 0–1600 |
| L3 | va chạm nhỏ; lá; gai cắm | `fx_hit_burst` (0,4), `fxs_leaf` | `strip` per target ×3; `burst leaf_fall tint #ff7a3a` 100, 1450; `decal crack` nhỏ 1400 | 100–1800 |
| L4 | hit-stop, rung | — | `stop light/light/medium`; `shake 2/2/4` | 950–1450 |
L1 đạt 2/3: vận tốc (quay nhanh dần, bắn kéo giãn) · phụ sinh (lá). Mật độ gai là cảm giác chính.

## 5. Asset
`fx_hit_burst` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 950, impact 1100, end 1800 }` (rút 200) · B2 gầm, lá đổi màu; phe ta lùi, giật · B3 cối xay → quạt · B4 va chạm, lá, gai cắm · B5 hit-stop tăng dần · B6 âm · B7 capture (case trùm đổi pha).

## 7. Nghiệm thu
Audit hết `DURATION_OVER`; capture: khung ~700 và ~900 gai quanh thân ở **góc khác nhau** (đang quay).
