# Kịch bản: Hiệu Lệnh Sấm (`skill_ult_ld`) — tuyệt kỹ

```json scenario
{
  "id": "skill_ult_ld", "kind": "skill", "name": "Hiệu Lệnh Sấm", "element": "LIGHTNING", "tier": 4, "durationMs": 3100,
  "status": "draft", "refs": [], "bibles": ["actions/ultimate", "elements/LIGHTNING"],
  "assets": [
    { "id": "fxp_horn_sigil", "state": "have", "layer": "L1" },
    { "id": "fx_cloud_flash", "state": "new", "layer": "L0", "spec": "Xem scenarios/ASSETS.md (dàn ngang trên đỉnh màn làm trời bão)" },
    { "id": "fx_bolt_strike", "state": "have", "layer": "L1" },
    { "id": "fx_spark_arc", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_bolt_mini", "state": "have", "layer": "L3" },
    { "id": "fxs_streak", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace", "bg_scene"]
}
```

## 1. Ý tưởng
**Huy hiệu sừng sấm khổng lồ** hiện giữa trời bão, **xoay và tích điện** (tia nhỏ bắn ra quanh vành); nó gọi **ba đợt sét**: trái → phải, phải → trái, rồi **TẤT CẢ cùng lúc**; điện thừa **chạy về** dưới chân phe ta thành tốc độ. Cảm giác: hiệu lệnh, nhịp trống trận 1-2-**3**. Tuyệt kỹ T4 (power 2,5), cả đội tăng tốc.

## 2. Hiện tại
`fxp_horn_sigil grow` 1,8 s (một ảnh to dần), 3 đợt `fx_bolt_strike`, chớp nhiều lần (950–1950 năm chớp), hit-stop ultimate. Audit: `STATIC_HERO`, `STATIC_SHARE`. Huy hiệu không xoay / không tích điện; ba đợt giống nhau về hướng.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái / đội | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Intro | 0–500 | `cast_charge`, sừng sáng | cut-in vàng điện | — | letterbox; nền **bão tím xám** + mây chớp trên đỉnh | sấm xa |
| 2 Huy hiệu | 500–1200 | giơ sừng | huy hiệu **hiện giữa trời** (grow outBack), **xoay**, vành rung (displacement), tia nhỏ bắn ra quanh vành, **sáng dần** | — | — | ù tích điện tăng |
| 3 Đợt 1 | 1200–1500 | — | sét đánh **trái → phải** từng quái (stagger 90) | giật | chớp 0,2 (một lần), rung 5 | "KRA" ×n |
| 4 Đợt 2 | 1700–2000 | — | sét đánh **phải → trái** | giật | rung 6 | "KRA" ×n |
| 5 Lặng | 2000–2200 | — | huy hiệu **co lại sáng chói**, im | — | gần đứng | im |
| 6 Đợt 3 | 2200 | — | **tất cả cùng lúc** sét 1,6× | giật mạnh, bật lùi | hit-stop ultimate, punch 1,05, chớp trắng 0,5, rung 10 | "KRA-KA-KOOM" |
| 7 Dư điện | 2400–3100 | dang chân đón | điện thừa **chạy về** phe ta thành vệt dưới chân; huy hiệu tan thành tia; `st_spd_up` cả đội | đội nghiêng tới trước | nền về, letterbox rút | lách tách |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền bão; mây chớp; letterbox | `fx_cloud_flash` (dàn ngang) | `bg_scene` (dự phòng `tint #1a1430 0.4`) + strip lặp | 0–3100 |
| L1 | huy hiệu; sét 3 đợt | `fxp_horn_sigil`, `fx_bolt_strike` | `prop grow` 500–800 + `spin 0.3` + `prop_displace` (vành rung) → co + sáng 2000–2200 → tan 2400–2700; sét: đợt 1 stagger 90 trái → phải, đợt 2 ngược lại, đợt 3 cùng lúc size 1,6 | 500–2700 |
| L2 | lõi sừng người dùng; vành huy hiệu sáng dần | — | `glow $color` actor 0–700; `glow` tăng trên huy hiệu | 0–2200 |
| L3 | tia bắn quanh vành; hồ quang trên quái; vệt điện về phe ta | `fxs_bolt_mini`, `fx_spark_arc`, `fxs_streak` | `burst bolt_pop` 600–1200; `strip fx_spark_arc` per target 2300; `tether` foes → allies `under` 2400–2700 + `burst streak_spray` per ally | 600–3100 |
| L4 | hit-stop, punch, chớp, rung tăng | — | chớp **chỉ** ở 1200 (0,2) và 2200 (0,5) — bỏ các chớp 950/1450/1950 (an toàn quang học); `shake 5/6/10`; `stop ultimate` 2200; `punch 1.05` | 1200–2500 |
L1 đạt 3/3: biến hình (vành rung, co / sáng) · phụ sinh (tia quanh vành) · vận tốc (grow outBack, xoay).

## 5. Asset
`fx_cloud_flash`, `fx_spark_arc` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp (giữ `{ 300, 1200, 3100 }`) · B2 giơ sừng; đội nghiêng tới · B3 huy hiệu → 3 đợt (hướng khác nhau) → lặng → đợt 3 → tan · B4 tia, hồ quang, vệt điện · B5 giảm số chớp, hit-stop · B6 âm · B7 capture (ultimates).

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: `FLASH_RATE` sạch; khung đợt 1 sét **bên trái trước**, đợt 2 **bên phải trước**; khung 2150 gần như đứng yên; khung ~2700 vệt điện dưới chân phe ta.
