# Kịch bản: Chuỗi Sét (`skill_ld_chain`)

```json scenario
{
  "id": "skill_ld_chain", "kind": "skill", "name": "Chuỗi Sét", "element": "LIGHTNING", "tier": 1, "durationMs": 1300,
  "status": "draft", "refs": [], "bibles": ["elements/LIGHTNING"],
  "assets": [
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô vàng #ffe14a)" },
    { "id": "fx_bolt_strike", "state": "have", "layer": "L1" },
    { "id": "fx_spark_arc", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_bolt_mini", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Sừng tích điện, **một tia sét nhảy ba lần** giữa các mục tiêu; mỗi cú **cao giọng hơn**, tia **mỏng dần**, cú cuối nổ to nhất. Cảm giác: nhanh, nhảy nhót, có nhịp 1-2-3. T1 (power 0,7 × nhiều cú), kẻ địch ngẫu nhiên.

## 2. Hiện tại
`tether` một lần tới mọi mục tiêu + `fx_pow_star` chung. Audit: `SHARED_FLIPBOOK_HERO`. Không thấy tia **nhảy** từ con này sang con kia.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Tích | 0–320 | pose `cast`, 8 tia nhỏ xoay quanh sừng **to dần** | — | — | — | ù tăng |
| 2 Cú 1 | 320 | giật đầu | tia zig-zag sừng → mục tiêu 1 | giật | hit-stop light 40, rung 3, chớp 0,1 | "zap" |
| 3 Cú 2 | 540 | — | tia **nhảy** từ mục tiêu 1 → 2 (mỏng hơn) | giật | hit-stop light 40, rung 3 | "zap" (cao hơn) |
| 4 Cú 3 | 760 | — | tia nhảy 2 → 3; trùng con thì **vọt lên trời rồi đánh xuống** | giật mạnh hơn | hit-stop medium 60, rung 4 | "ZAP" |
| 5 Nổ | 760–900 | — | nổ va chạm 1,4× ở con cuối | bật lùi | — | "ding" |
| 6 Dư âm | 900–1300 | idle | hồ quang nhỏ trên mỗi con trúng | — | — | lách tách |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | 3 tia nhảy; va chạm | — (tether code), `fx_hit_burst` tô vàng | `tether` actor → t1 (width 6) 320–420; t1 → t2 (width 4) 540–640; t2 → t3 (width 3) 760–860 — [cần nối tether giữa hai mục tiêu: dùng `who` chuỗi; nếu engine chưa hỗ trợ, tia từ trên trời `fx_bolt_strike` cho cú 2–3]; `strip fx_hit_burst` mỗi cú, cú cuối size 1,4 | 320–1000 |
| L2 | sừng tích điện | — | `glow #ffe14a` nhấp 0–320 | 0–320 |
| L3 | tia nhỏ quanh sừng; hồ quang | `fxs_bolt_mini`, `fx_spark_arc` | `burst bolt_pop` xoay 0–320; `strip fx_spark_arc size 0.5` per target sau khi trúng | 0–1300 |
| L4 | hit-stop tăng dần | — | `stop light/light/medium`; `shake 3/3/4`; `flash 0.1` mỗi cú | 320–900 |
L1 đạt 2/3: biến hình (tia code mới mỗi lần, va chạm 6 khung) · vận tốc / hướng (nhảy có thứ tự).

## 5. Asset
`fx_hit_burst`, `fx_spark_arc` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp `{ release 320, impact 320, end 1300 }`, `stagger 220` · B2 sừng, mục tiêu giật · B3 ba tia nhảy (kiểm khả năng nối tether mục tiêu → mục tiêu; ghi engine nếu thiếu) · B4 hồ quang · B5 hit-stop tăng dần · B6 âm cao dần · B7 capture (3 quái).

## 7. Nghiệm thu
Audit hết `SHARED_FLIPBOOK_HERO`; capture: 3 khung impact, mỗi khung tia **xuất phát từ con trước**; độ dày tia giảm dần.

## Hợp đồng nhìn thấy (bản 3D, 2026-11-12, `chain_lightning`)
```
Skill: skill_ld_chain — Chuỗi Sét   Hệ: SẤM   Bậc: T1 × 3   Đích: kẻ địch ngẫu nhiên × 3   Kết thúc: 1550 ms
descVi: "Ba tia sét đánh vào kẻ địch ngẫu nhiên."
PHẢI THẤY:
  1. Nền tối lại; một đám MÂY GIÔNG có khối (bụng tối, đỉnh nhạt) cuộn tới trên hàng địch; tia nhỏ nháy dưới bụng mây (0–320).
  2. Đúng BA tia sét, lần lượt 320 / 540 / 760 ms, mỗi tia từ mây xuống MỘT kẻ địch thật sự bị đánh (ngẫu nhiên, lấy từ lượt đánh); tia gấp khúc, PHÂN NHÁNH, vẽ lại đường đi mỗi 45 ms (giật).
  3. Giữa hai kẻ địch bị đánh liên tiếp có một cung điện mảnh nhảy sang (chuỗi).
  4. Ở mỗi điểm trúng: lóe sáng + sao bốn cánh, vòng sáng lan trên đất, tia lửa bắn vệt, điện bò trên đất, vết cháy, khói mỏng. Mây sáng lên từ bên trong mỗi lần đánh.
  5. Tia thứ ba to nhất (1-2-BỤP): rung mạnh hơn, chớp trắng.
KHÔNG ĐƯỢC: tia mượt như dây; sét cộng màu trên nền sáng (phải tối nền); chớp mạnh hơn 2 lần / giây (hai tia đầu chỉ chớp nhẹ 0,14); vẽ choáng.
NHỊP: Mây 0–320 · Tia 1 320 · Tia 2 540 · Tia 3 760 (hit-stop 50) · Dư âm 760–1400
HÌNH CHỦ ĐẠO: tia sét phân nhánh — biến hình (đổi đường đi liên tục) + hạt sinh từ chính nó (tia lửa, điện bò)
KIỂM: −120 mây + tia nhỏ; +20 tia 1 và lóe sáng; +240 cung điện nhảy sang con thứ hai; +460 tia 3; +900 mây tan, vết cháy mờ. FPS ≥ 50.
```
