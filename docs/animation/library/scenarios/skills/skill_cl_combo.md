# Kịch bản: Liên Hoàn (`skill_cl_combo`) — lớp Chiến Binh

```json scenario
{
  "id": "skill_cl_combo", "kind": "skill", "name": "Liên Hoàn", "element": "SELF", "tier": 2, "durationMs": 1450,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit"],
  "assets": [
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo hệ)" },
    { "id": "fx_slash_long", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo hệ, cú đá ngang)" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (cú đập cuối)" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Ba đòn liên hoàn**: **đấm thẳng → xoay người đá → nhảy lên đập xuống**, mỗi cú **mạnh hơn**; bóng mờ giữa các cú; lộn ngược về. Cảm giác: nhịp 1-2-**3**, "ha! hya! HYAAA!". Power 0,6 **mỗi cú** × 3 → bậc tổng T2 (audit hiện báo T1/T4 vì tính một cú; rung 7 ở cú 3 là quá).

## 2. Hiện tại
`fx_pow_star`, `fx_slash_arc`, `fx_boom` chung. Audit: `IMPACT_OVER_TIER`, `SHARED_FLIPBOOK_HERO`.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Áp sát | 0–220 | lao tới sát | — | — | — | "ha!" |
| 2 Đấm | 220 | đấm thẳng (lunge ngắn) | va chạm nhỏ 0,6 | giật | hit-stop light 40, rung 2 | "pak" |
| 3 Đá | 470 | **xoay người** nửa vòng đá ngang | vệt ngang theo hệ | lệch ngang | hit-stop light 40, rung 2 | "hya!" |
| 4 Đập | 720 | **nhảy lên** 40 rồi **đập xuống** | va chạm 1,0 + bụi vòng | văng 40 | hit-stop medium 80, punch 1,03, rung 4 | "HYAAA!" |
| 5 Về | 720–1450 | **lộn ngược** về chỗ | hạt theo hệ rơi | ngồi dậy | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | 3 va chạm | `fx_hit_burst` (0,6 / 0,8 / 1,0), `fx_slash_long` (cú 2) | `strip` 220, 470 (`slash_long`), 720 | 220–950 |
| L2 | bóng mờ giữa các cú | — | `trail every 40` 200–760 | 200–760 |
| L3 | bụi vòng cú 3; hạt | `fx_dust_ring` | `strip under` 720; `burst $spark` ×3 | 220–1000 |
| L4 | hit-stop tăng dần | — | `stop light/light/medium`; `shake 2/2/4` (thay 3/3/7); `punch 1.03` 720 | 220–900 |
Thân người đánh (đấm → xoay → nhảy đập → lộn) là hình chủ đạo: vận tốc + nhịp tăng dần.

## 5. Asset
`fx_hit_burst`, `fx_slash_long`, `fx_dust_ring` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 220, impact 720, end 1450 }` (số sát thương theo từng cú nếu engine chia) · B2 đấm / xoay / nhảy / lộn · B3 va chạm ×3 · B4 bụi, hạt · B5 hit-stop tăng dần, **rung tối đa 4** · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit: `IMPACT_OVER_TIER` hết sau khi hạ rung (audit đọc power mỗi cú — ghi chú cho TD); capture: ba khung impact có **ba tư thế khác nhau** của heo.
