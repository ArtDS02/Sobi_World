# Kịch bản: Gai Độc (`skill_mm_poison_thorn`)

```json scenario
{
  "id": "skill_mm_poison_thorn", "kind": "skill", "name": "Gai Độc", "element": "NATURE", "tier": 2, "durationMs": 1100,
  "status": "draft", "refs": [], "bibles": ["elements/NATURE", "motifs/poison", "actions/projectile"],
  "assets": [
    { "id": "fxs_thorn", "state": "have", "layer": "L1" },
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô tím độc, size 0,5)" },
    { "id": "fxs_spore", "state": "have", "layer": "L3" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Ba gai mọc bật trên lưng**, phóng **hình quạt hội tụ** như phi tiêu xoay; **cắm thành hàng** "tch-tch-tch" trên thân mục tiêu, rồi **nở bọt độc**; mặt mục tiêu **xanh lét**. Cảm giác: chính xác, có nhịp 3, độc âm ỉ sau đó. T2, 70 % Độc. (Brief mẫu cũ của decision 040.)

## 2. Hiện tại
3 burst `thorn_spray` + 3 `fx_pow_star` chung. Audit: `SHARED_FLIPBOOK_HERO`. Không có gai **bay** riêng rẽ (chỉ hạt), va chạm là sao chung.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Mọc gai | 0–300 | pose `cast`, lắc đầu | 3 gai **mọc bật** trên lưng (pop outBack, lệch 60) | — | — | "sprk" ×3 |
| 2 Phóng | 300–440 | giật lùi 3 nhịp nhỏ | 3 gai rời lưng lệch 70 ms, **quạt** (lệch góc −15° / 0 / +15°) **hội tụ**, xoay, vệt lá | — | — | "fwip" ×3 |
| 3 Cắm | 600 / 670 / 740 | — | mỗi gai **cắm** (dừng, rung) thành hàng ngang trên thân + va chạm tím nhỏ | giật ×3 | hit-stop light 40 mỗi gai, rung 3 | "tch-tch-tch" |
| 4 Nở độc | 760–1100 | idle | gai **nở** thành bào tử, bọt độc sủi lên; mặt mục tiêu tint xanh tím; `st_poison` | co người | — | "blub" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | 3 gai; va chạm | `fxs_thorn` ×3 (size 0,3), `fx_hit_burst` (tím, 0,5) | `prop pop` trên lưng 0–300 → `prop throw` arc 15/0/−15 + `stretch` + `spin 2` stagger 70 → `hover` + `wobble` khi cắm tới 760 → alpha | 0–800 |
| L2 | vệt lá | — | `trail` xanh mảnh | 300–600 |
| L3 | lá; bào tử; bọt độc | `fxs_leaf`, `fxs_spore` | `prop … trail leaf_trail every 80`; `burst spore_pop` 760; `burst bubble_rise tint #7be08a` 850 | 300–1100 |
| L4 | hit-stop ×3; tint độc | — | `stop light` ×3; `shake 3`; `glow #9a6ad6 tint` 760 | 600–1000 |
L1 đạt 3/3: biến hình (gai nở, va chạm khung) · phụ sinh (lá, bào tử) · vận tốc (quạt hội tụ, kéo giãn).

## 5. Asset
`fx_hit_burst` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp `{ release 300, impact 600, end 1100 }`, stagger 70 · B2 lắc đầu, giật lùi ×3; mục tiêu giật ×3 · B3 gai mọc → bay quạt → cắm → nở · B4 lá, bào tử, bọt · B5 hit-stop ×3 · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `SHARED_FLIPBOOK_HERO`; capture: khung ~400 thấy **3 gai** ở 3 độ cao (quạt); khung ~750 ba gai cắm **thành hàng** trên thân.
