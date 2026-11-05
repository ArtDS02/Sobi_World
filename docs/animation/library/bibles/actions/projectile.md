# Bible hành động: PHÓNG ĐẠN (projectile)

Mọi skill có vật bay từ người ra đòn tới mục tiêu (bong bóng, quả cầu, mũi gai, mảnh băng, tia lửa…). Khuôn giai đoạn: **Prep → Startup → Execution (giật lùi) → Travel → Impact → Aftermath** (STANDARDS §1). Nhịp mặc định của engine: `deliveries.projectile` = release 260 · impact 520 · end 760 ms.

## 1. Từng giai đoạn
| Giai đoạn | Người ra đòn | Đạn | Act gợi ý |
|---|---|---|---|
| Prep 200–350 | nén người, nghiêng ra sau, pose `cast` | — | `pose cast`, `move cast_coil`, `glow $color` nhẹ |
| Startup 100–200 | giữ pose | **hình thành ở điểm `front`**: phồng từ nhỏ (scale 0,3 → 1 + overshoot), hạt hút vào | `prop path: pop` (`ease: outBack`), `burst …_rise` / hút vào |
| Execution 60–100 | **giật lùi** ngược hướng bắn (recoil), tóc / đuôi trễ nhịp | rời tay, nhanh nhất ở khung đầu | `move recoil x 10–20`, `sound` |
| Travel 250–450 | lò xo về chỗ | bay theo **cung** (arc 30–70; vật nặng cao hơn), **kéo giãn theo vận tốc**, hạt rơi khỏi vật | `prop path: throw` + `arc` + `stretch: true` + `trail: {ref, every: 50–80}` |
| Impact 60–120 + hit-stop | — | **bẹp / vỡ**, không biến mất trong 1 khung | `prop … squashOnHit`, `strip` va chạm của hệ, `burst …_spray`, `stop` theo bậc, mục tiêu `move knock` theo hướng bay |
| Aftermath 300–600 | idle | mảnh / giọt / tàn rơi, vết trên đất | `burst …_fall`, `decal` |

## 2. Quy tắc
- **Đường đi không thẳng đều**: ít nhất một trong cung, gia tốc (`fly` = inQuad), hoặc lượn. Đạn ánh sáng / sấm được phép thẳng nhưng phải cực nhanh (≤ 150 ms) và có vệt.
- **Đạn ≠ ảnh dán**: đạt ≥ 2/3 dấu hiệu sống (STANDARDS §2). Cách rẻ nhất khi chỉ có ảnh tĩnh: `stretch` + `trail` hạt + `pulse` nhỏ + vỡ bằng flipbook riêng.
- **Tâm va chạm** đặt ở thân mục tiêu (`chest`), không ở chân, trừ đạn rơi từ trên.
- **Nhiều đạn**: lệch nhịp 60–120 ms, kích cỡ khác nhau ±20 %, đạn cuối mạnh nhất.
- **Hướng**: ảnh đạn vẽ hướng **sang phải** (style guide §5); engine xoay khi bay sang trái.

## 3. Theo hệ (chi tiết ở bible hệ)
| Hệ | Đạn | Đường đi | Vỡ |
|---|---|---|---|
| Nước | bong bóng / giọt lớn | cung tròn, nặng | vòng + giọt parabol (WATER §2) |
| Băng (motif) | mảnh nhọn | thẳng, xoay theo hướng | nứt → mảnh sắc (ice §1) |
| Lửa | cầu lửa có lưỡi lửa biến hình | cung thấp, tăng tốc | nổ, tàn bay **lên** |
| Thiên nhiên | gai / lá / hạt giống | lượn nhẹ | cắm vào, lá rơi lả tả |
| Đất | đá | cung cao, nặng | rơi phịch, bụi vòng |
| Kim | lưỡi / mảnh kim | thẳng, cực nhanh | chữ thập loé, tia kim |
| Sấm | tia | zigzag tức thời | trắng 1 khung, nhánh |
| Ánh sáng | sao / giáo sáng | thẳng nhanh | nở sao |
| Bóng tối | khối mực | chậm, rung | loang rồi co |
| Hư Không | vòng rỗng | xoáy | sụp vào rồi bung |

## 4. Mẫu kiểm (đạt khi)
`anim:audit` không có `STATIC_HERO`, `NO_PREPARATION`, `NO_AFTERMATH`, `IMPACT_UNDER_TIER`; capture: đạn đổi hình giữa các frame bay (hoặc có kéo giãn + hạt), mục tiêu bật theo hướng bay ở khung `impact+80`.

REF: [REF-WATER-BUBBLE-001](../../refs/REF-WATER-BUBBLE-001.json).
