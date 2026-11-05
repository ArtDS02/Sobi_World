# Kịch bản phản ứng: Điện Giật (`reaction_shock`)

```json scenario
{
  "id": "reaction_shock", "kind": "reaction", "name": "Điện Giật", "element": "LIGHTNING", "tier": 2, "durationMs": 800,
  "status": "draft", "refs": [], "bibles": ["elements/LIGHTNING", "elements/WATER"],
  "assets": [
    { "id": "fx_spark_arc", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_bolt_mini", "state": "have", "layer": "L3" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Mục tiêu **đang Ướt** trúng Sấm: giọt nước trên đầu **bị sét đánh**, cả thân **sáng điện nhấp nháy 3 lần** (sáng / tối 60 ms) kiểu hoạt hình, **hồ quang chạy quanh thân**, nước **bốc hơi trắng**. Cảm giác: "bzzzZZT!", hài hước có lực. +30 % sát thương, 35 % Choáng, hết Ướt.

## 2. Hiện tại
stop 140 (vượt rubric 100 cho đòn thường), rung 8, glow, tia, hơi. Thiếu nhấp nháy thân 3 lần, hồ quang chạy quanh thân.

## 3. Kịch bản theo nhịp
| # | ms | Mục tiêu | Hiệu ứng | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Chạm | 0 | khựng | tia sét chạm giọt nước trên đầu, lóe trắng 1 khung | hit-stop medium 100 | "bz" |
| 2 Giật ×3 | 0–360 | **sáng trắng / tối** xen kẽ 60 ms ×3, run cứng | **hồ quang** chạy quanh thân, tia nhỏ bắn | rung 4 | "zzZZT!" |
| 3 Bốc hơi | 360–600 | lắc đầu | nước **bốc hơi trắng** 4 cụm bay lên | — | "pssh" |
| 4 Dư âm | 600–800 | (nếu Choáng: `stun` apply) | hồ quang nhỏ còn nhảy | — | lách tách |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | hồ quang quanh thân | `fx_spark_arc` (size 1,2) | `strip` loop 0–600 |
| L2 | thân nhấp nháy | — | `glow #fffbd0 bright 2` ×3 (0, 120, 240; dur 60) — **chỉ thân**, không chớp toàn màn |
| L3 | tia; hơi | `fxs_bolt_mini`, `fxs_puff` | `burst bolt_pop`; `burst puff_rise tint #ffffff` 360 |
| L4 | hit-stop, rung | — | `stop medium 100` (từ 140); `shake 4` (từ 8); `move shake x 3 n 6` |

## 5. Asset
`fx_spark_arc` **mới**.

## 6. Các bước dựng
B1 ≤ 800 (giới hạn phản ứng 1200) · B2 run cứng / lắc · B3 hồ quang · B4 tia, hơi · B5 hit-stop 100, rung 4; nhấp nháy chỉ trên thân (an toàn quang học) · B6 âm · B7 capture (suite reactions).

## 7. Nghiệm thu
Capture: 3 khung trong 0–300 thân **sáng / tối** khác nhau; `FLASH_RATE` sạch; `HITSTOP_RANGE` sạch.
