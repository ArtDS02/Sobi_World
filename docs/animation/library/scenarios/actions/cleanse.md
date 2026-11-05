# Kịch bản hành động: Được thanh tẩy (`cleanse`)

```json scenario
{
  "id": "cleanse", "kind": "action", "name": "Được thanh tẩy", "element": "NONE", "tier": 0, "durationMs": 500,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "actions/status"],
  "assets": [
    { "id": "fx_ink_bloom", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (K4–K6: co lại, tan)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Một trạng thái xấu bị xóa: icon **bong ra như mực**, **co lại tan khói**, gió cuốn đi; thân **sáng lại**, thở phào. Lớp chung cho mọi lần xóa trạng thái xấu (skill riêng có thể thêm hình của mình).

## 2. Hiện tại
`actions.cleanse`: glow + `fx_light_pillar` + dấu cộng — trông như hồi máu (dấu cộng), không thấy điều xấu **bị gỡ bỏ**.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Bong | 0–300 | rùng mình | mực **co lại** trên thân rồi tan | "whoosh" |
| 2 Sáng | 300–500 | thở phào, đứng thẳng | lấp lánh | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | mực co | `fx_ink_bloom` (K4–K6, 0,6) | `strip frames [3,5]` |
| L3 | lấp lánh | `fxs_star` | `burst star_pop` |
| L4 | rùng mình / phào | — | `move shake` → `puff_up 1.03` |

## 5. Asset
`fx_ink_bloom` **mới**.

## 6. Các bước dựng
B1 ≤ 500 · B2 rùng / phào · B3 mực co · B4 lấp lánh · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Không chạy chồng khi skill đã có hình xóa riêng (giống ANIM-123).
