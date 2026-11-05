# Kịch bản hành động: Phe ta vào trận (`enter_ally`)

```json scenario
{
  "id": "enter_ally", "kind": "action", "name": "Phe ta vào trận", "element": "NONE", "tier": 0, "durationMs": 500,
  "status": "draft", "refs": [], "bibles": ["actions/idle-and-states"],
  "assets": [
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (nhỏ 0,5)" },
    { "id": "fx_poof", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Phe ta **nhảy vào sân** từ mép trái theo đường vồng (cao 60), **đáp đất bẹp** 0,85 rồi bật 1,05 → 1,0, bụi ở chân; lệch nhau 90 ms. Đọc ngay ai đứng đâu. "hup!".

## 2. Hiện tại
appear + squash + `fx_poof`: hiện tại chỗ, không có đường nhảy vào.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Nhảy vào | 0–350 | từ ngoài mép trái **nhảy vồng** vào chỗ, kéo giãn khi bay | — | "hup!" |
| 2 Đáp | 350–500 | **bẹp** 0,85 → 1,05 → 1,0 | bụi vòng nhỏ ở chân | "thump" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L3 | bụi | `fx_dust_ring` (0,5), `fx_poof` | `strip` 350 |
| L4 | nhảy vào; bẹp / bật | — | `move jump` từ x −200 (cần `move` có điểm xuất phát ngoài màn — kiểm `appear`) + `squash` |

## 5. Asset
`fx_dust_ring` **mới**.

## 6. Các bước dựng
B1 500, stagger 90 · B2 nhảy / bẹp / bật · B4 bụi · B5 không rung · B6 âm · B7 capture (đầu trận).

## 7. Nghiệm thu
Capture: khung ~200 con **chưa ở chỗ đứng** (đang bay vào).
