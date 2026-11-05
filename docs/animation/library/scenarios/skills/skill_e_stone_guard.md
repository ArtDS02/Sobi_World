# Kịch bản: Thủ Đá (`skill_e_stone_guard`) — quái lính đá

```json scenario
{
  "id": "skill_e_stone_guard", "kind": "skill", "name": "Thủ Đá", "element": "SUPPORT", "tier": 0, "durationMs": 1250,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/EARTH"],
  "assets": [
    { "id": "fxp_stone_plate", "state": "have", "layer": "L1" },
    { "id": "fx_stone_rise", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_rune_a", "state": "have", "layer": "L2" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Lính đá **đập ngực hai cái** "DUM DUM"; **phiến đá trồi** trước từng đồng bọn; **rune trên phiến sáng** một nhịp; phiến chìm xuống. Cảm giác: quân kỷ, chắc chắn. Thủ cả đội, T0. Lính Gác Đá, Hộ Pháp Cổ Đại.

## 2. Hiện tại
`fxp_stone_plate` trồi. Audit: `STATIC_HERO`, `STATIC_SHARE`.

## 3. Kịch bản theo nhịp
| # | ms | Lính / bầy | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Đập ngực | 0–300 | đập ngực ×2 (squash nhịp) | bụi bắn từ ngực | "DUM DUM" |
| 2 Trồi | 300–800 | — | đất nứt → **phiến đá trồi theo nấc** trước từng con (stagger 110) | "clack" ×n |
| 3 Rune | 800 | bầy đứng thẳng | **rune trên phiến sáng** một nhịp | "ting" |
| 4 Chìm | 800–1250 | idle | phiến **chìm** xuống; `st_def_up` | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | phiến trồi | `fx_stone_rise` (trồi theo nấc), `fxp_stone_plate` (đứng) | `strip fx_stone_rise frames [0,3]` per ally stagger 110 → chuyển `fxp_stone_plate` đứng 700–1000 → `rise` ngược chìm 1000–1200 | 300–1200 |
| L2 | rune sáng | `fxs_rune_a` (tô vàng đất) | `prop pop` trên mỗi phiến + `glow` 800–950 | 800–950 |
| L4 | đập ngực; bầy thẳng | — | `move squash 0.95` ×2; `move puff_up 1.03` bầy (không rung) | 0–900 |
L1 đạt 2/3: biến hình (trồi theo nấc khung) · phụ sinh (rune sáng).

## 5. Asset
`fx_stone_rise` **mới**.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 đập ngực; bầy thẳng · B3 phiến trồi → chìm · B4 rune · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: phiến ở **độ cao khác nhau** trước các con trong khung ~500.
