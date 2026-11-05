# Kịch bản: Mưa Nguyên Tố (`skill_cl_elemental_rain`) — lớp Pháp Sư

```json scenario
{
  "id": "skill_cl_elemental_rain", "kind": "skill", "name": "Mưa Nguyên Tố", "element": "SELF", "tier": 2, "durationMs": 1500,
  "status": "draft", "refs": [], "bibles": ["actions/cast"],
  "assets": [
    { "id": "fx_hit_burst", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô theo hệ, size 0,4)" },
    { "id": "fxs_ember", "state": "have", "layer": "L1" },
    { "id": "fxs_drop", "state": "have", "layer": "L1" },
    { "id": "fxs_pebble", "state": "have", "layer": "L1" },
    { "id": "fxs_leaf", "state": "have", "layer": "L1" },
    { "id": "fxs_metal_bit", "state": "have", "layer": "L1" },
    { "id": "fxs_bolt_mini", "state": "have", "layer": "L1" },
    { "id": "fxs_ink_blob", "state": "have", "layer": "L1" },
    { "id": "fxs_star", "state": "have", "layer": "L1" },
    { "id": "fxs_ice_shard", "state": "have", "layer": "L1" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Giơ tay, **vòng phép theo hệ mở trên trời** phía trên phe địch, **mưa hạt hệ** (than / giọt / sỏi / lá / mảnh kim / tia / mực / sao / pha lê — theo hệ của heo) **trút xiên** xuống, mỗi hạt chạm **nổ nhỏ**; vòng phép tan. Cảm giác: dày đặc, rào rào. T2 diện rộng (power 0,95).

## 2. Hiện tại
`$boom` trên từng quái (không có mưa thật, không vòng phép trên trời). Audit: `STATIC_HERO`, `STATIC_SHARE`; bậc có T1.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Mở vòng | 0–400 | pose `cast`, giơ tay | vòng phép hệ **mở** trên cao phía trên phe địch (vẽ dần), quay | ngước | tối 10 % | ngân |
| 2 Mưa | 400–1100 | giữ tay | 14 hạt hệ to **rơi xiên** từ vòng (rải đều 700 ms, vị trí ngẫu nhiên có seed), kéo giãn khi rơi | — | — | mưa rào theo hệ |
| 3 Chạm | 450–1150 | — | mỗi hạt chạm: nổ nhỏ hệ 0,4 | giật mỗi lần trúng (~3 lần/con) | hit-stop light 50 ở lần trúng đầu, rung 2 liên tục | "pit-pat" |
| 4 Tan | 1100–1500 | hạ tay | vòng phép tan thành hạt | — | nền về | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | tối nhẹ | — | `tint 0.1` | 0–1400 |
| L1 | hạt mưa theo hệ | sprite `fxs_*` theo hệ (bảng ý tưởng) | 14 `prop fall` size 0,25, lệch x ngẫu nhiên, `stretch`, `arc` xiên, lệch 50 ms — sprite lấy qua `$spark` / bảng hạt theo hệ (cần map hệ → sprite: dùng `particles.<id>.art` có sẵn qua `burst` hướng xuống nếu `prop` không chọn được sprite theo hệ) | 400–1150 |
| L2 | vòng phép trên trời | — | `decal rune` đặt `sky` (hoặc `strip fx_rune_lock` tô $color) vẽ dần + quay | 0–1500 |
| L3 | nổ nhỏ | `fx_hit_burst` (0,4, $glow) | `strip` per target ×3 lệch | 450–1150 |
| L4 | rung nhẹ liên tục; giật | — | `shake 2` 450–1150; `stop light` 450; `move shake` targets | 450–1150 |
L1 đạt 2/3: phụ sinh (mưa từ vòng) · vận tốc (rơi kéo giãn). Mật độ + nhịp tạo cảm giác.

## 5. Asset
`fx_hit_burst` **mới**; sprite hệ có sẵn. Kỹ thuật: cần cách để một act chọn sprite theo hệ (`$spark` hiện là id hạt `_pop`) — dùng `burst` hạt `_fall` của hệ với hướng xiên là phương án không cần engine.

## 6. Các bước dựng
B1 nhịp `{ release 400, impact 450, end 1500 }` · B2 giơ / hạ tay; quái giật · B3 mưa (thử `burst <hệ>_fall` dày từ `sky`) · B4 nổ nhỏ, vòng phép · B5 rung 2 liên tục + hit-stop light · B6 âm · B7 capture (3 hệ).

## 7. Nghiệm thu
Audit hết `STATIC_HERO`, bậc có T2; capture: khung ~700 thấy **nhiều hạt đang rơi** cùng lúc, màu / hình đúng hệ.
