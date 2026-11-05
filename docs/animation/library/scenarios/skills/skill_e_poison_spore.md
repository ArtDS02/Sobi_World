# Kịch bản: Bào Tử Độc (`skill_e_poison_spore`) — quái Mầm Gai

```json scenario
{
  "id": "skill_e_poison_spore", "kind": "skill", "name": "Bào Tử Độc", "element": "NATURE", "tier": 1, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["elements/NATURE", "motifs/poison"],
  "assets": [
    { "id": "fx_smoke_curl", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô xanh độc #7be08a pha tím, mây bào tử quanh mục tiêu)" },
    { "id": "fxs_spore", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Quái **phồng như quả bóng, đỏ mặt**, rồi **"PFFF"** phun **mây bào tử** lơ lửng (nón hẹp), xẹp lại; **mây bao quanh** mục tiêu, nó **ho sặc sụa**. Cảm giác: hài hước, âm ỉ. T1 (power 0,8), 60 % Độc.

## 2. Hiện tại
`cone` + bào tử, dư âm đã thêm; không có va chạm (bậc T0). Audit: `NO_AFTERMATH` (do không có mốc va chạm).

## 3. Kịch bản theo nhịp
| # | ms | Quái | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Phồng | 0–350 | **phồng 1,2**, mặt đỏ (tint) | — | — | — | "mmmm" |
| 2 Phun | 350–700 | **xẹp** nhanh về 0,95 | 16 bào tử bay **lơ lửng** theo nón hẹp | — | — | "PFFF" |
| 3 Bao | 700 | — | **mây bào tử cuộn** quanh mục tiêu | **ho** (lắc ngắn ×3) | hit-stop light 40 | "khụ khụ" |
| 4 Dư âm | 700–1150 | idle | mây tan dần, bọt độc sủi; `st_poison` | tint xanh tím | — | "khụ" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | mây quanh mục tiêu | `fx_smoke_curl` (xanh tím) | `strip loop hold 300` tại target 700–1050 | 700–1100 |
| L2 | mặt đỏ | — | `glow #ff7a7a tint` actor 0–350 | 0–350 |
| L3 | nón bào tử; bọt độc | `fxs_spore`, (cone code) | `cone width` hẹp 350–700 + `burst spore_spray` theo nón; `burst bubble_rise tint #7be08a` 900 | 350–1150 |
| L4 | phồng / xẹp; ho; hit-stop nhẹ | — | `move puff_up 1.2` → `squash 0.95`; `move shake n 3` target; `stop light 40` | 0–1000 |
L1 đạt 2/3: biến hình (mây cuộn loop) · phụ sinh (bọt).

## 5. Asset
`fx_smoke_curl` **mới**; dự phòng `fx_poof` tô xanh tím hold.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 phồng / xẹp; ho · B3 nón → mây · B4 bọt · B5 hit-stop light (để có mốc va chạm) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `NO_AFTERMATH` (có mốc va chạm); capture: khung ~300 quái **to hơn** khung 0; khung ~800 mây quanh mục tiêu.
