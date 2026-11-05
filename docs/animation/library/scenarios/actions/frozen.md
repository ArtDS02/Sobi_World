# Kịch bản hành động: Mất lượt vì Đóng băng (`frozen`)

```json scenario
{
  "id": "frozen", "kind": "action", "name": "Mất lượt: Đóng băng", "element": "WATER", "tier": 0, "durationMs": 600,
  "status": "draft", "refs": ["REF-ICE-ENCASE-001"], "bibles": ["motifs/ice", "actions/idle-and-states"],
  "assets": [
    { "id": "fx_ice_encase", "state": "have", "layer": "L1" },
    { "id": "fxs_snowflake", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Đến lượt mà **đóng băng**: thân **đứng cứng** trong vỏ băng, chỉ **run cầm cập** (rung ngang 1 px ×4), **vệt sáng lướt** dọc băng, tuyết rơi, "krrk" băng kêu.

## 2. Hiện tại
glow lạnh + `fx_ice_encase` khung 3 hold + tuyết. Đạt (bible ice: giữ); thiếu run cầm cập (thân nên **không** đứng yên tuyệt đối khi đến lượt).

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Run | 0–600 | **run ngang 1 px ×4** (dù `freezeBody`), tint lạnh 30 % | băng khung 3 giữ; **vệt sáng lướt** chéo; 4 bông tuyết rơi | "krrk" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | băng | `fx_ice_encase` | `frames [3,3] hold 520` (giữ) |
| L2 | vệt sáng | — | `glow` lướt / `burst star_pop` 3 điểm lệch 80 |
| L3 | tuyết | `fxs_snowflake` | `burst snow_fall` (giữ) |
| L4 | run | — | `move shake x 1 n 4` (cần cho phép rung nhỏ khi `freezeBody`) |

## 5. Asset
Đủ.

## 6. Các bước dựng
B1 600 · B2 run · B3 giữ băng · B4 vệt sáng, tuyết · B5 không rung màn · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: thân lệch 1 px giữa các khung (run) nhưng không rời chỗ.
