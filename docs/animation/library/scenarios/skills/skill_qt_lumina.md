# Kịch bản: Tia Lumina (`skill_qt_lumina`)

```json scenario
{
  "id": "skill_qt_lumina", "kind": "skill", "name": "Tia Lumina", "element": "LIGHT", "tier": 3, "durationMs": 1400,
  "status": "draft", "refs": [], "bibles": ["elements/LIGHT", "actions/cast"],
  "assets": [
    { "id": "fxp_lumina_ring", "state": "have", "layer": "L1" },
    { "id": "fxp_lumina_spear", "state": "have", "layer": "L1" },
    { "id": "fx_light_pillar", "state": "have", "layer": "L1" },
    { "id": "fx_star_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Vòng quang phổ mở sau lưng**, quay, hút sao vào tâm; vòng **nén lại thành ngọn giáo sáng**, phóng xuyên mục tiêu, **cột sáng giáng xuống**. Cảm giác: thiêng, nén lực rồi bung. T3 (power 2,2): tác động bằng sáng + punch, rung vừa.

## 2. Hiện tại
`fxp_lumina_ring grow` + `fxp_lumina_spear fly` + beam + `fx_light_pillar` + `fx_pow_star`, hit-stop 100, rung 6. Audit: `STATIC_HERO`, `STATIC_SHARE`, `FEW_LAYERS`, `DURATION_UNDER` (1160). Vòng chỉ phóng to; không thấy "nén thành giáo".

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Mở vòng | 0–460 | pose `cast`, bay lên 12 px | vòng **mở** sau lưng (grow outBack) và **quay**, 12 sao **hút vào tâm** | — | tối nhẹ 10 % | hợp xướng "aah" ngắn |
| 2 Nén | 460–600 | giữ, rung nhẹ | vòng **co lại** (scale 1 → 0,2) + sáng chói, biến thành giáo | — | — | ngân tăng |
| 3 Phóng | 600–700 | giật lùi 14 | giáo bay thẳng **kéo giãn**, vệt sáng dày | — | — | "SHHING" |
| 4 Giáng | 700 | — | giáo xuyên + **cột sáng giáng** + sao nở | bật lùi 24, tint trắng | hit-stop medium 90, punch 1,04, chớp vàng 0,3, rung 4 | "BOOM" sáng |
| 5 Dư âm | 700–1400 | đáp xuống | giáo tan thành 20 sao, cột sáng **thu hẹp** dần, lấp lánh rơi | — | nền về | lấp lánh |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | tối nhẹ | — | `tint 0.1` | 0–1100 |
| L1 | vòng; giáo; cột sáng | `fxp_lumina_ring`, `fxp_lumina_spear`, `fx_light_pillar` | `prop grow` + `spin 0.5` 0–460 → co (scale ↓) 460–600; `prop fly` + `stretch` 600–700; `strip fx_light_pillar hold 400` 700 | 0–1200 |
| L2 | lõi sáng actor; vệt giáo | — | `glow #fff2a8` tăng 0–600; `trail` trên giáo | 0–700 |
| L3 | sao hút vào; sao nở; sao tan | `fxs_star`, `fx_star_bloom` | `burst star_pop` hút vào 100; `strip fx_star_bloom` 700; `burst star_fall` 850 | 100–1400 |
| L4 | hit-stop, punch, chớp, bật | — | `stop medium`; `punch 1.04`; `flash #ffe98a 0.3`; `shake 4`; `move knock x 24` | 700–1000 |
L1 đạt 3/3: biến hình (vòng mở / co; cột sáng khung) · phụ sinh (sao) · vận tốc (giáo kéo giãn).

## 5. Asset
`fx_star_bloom` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp `{ release 600, impact 700, end 1400 }` (dài thêm cho pha nén) · B2 bay lên / đáp; mục tiêu bật · B3 vòng → nén → giáo → cột · B4 sao · B5 hit-stop medium + punch (rubric 50–100 ms) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`, `FEW_LAYERS`, `DURATION_UNDER`; capture: khung ~300 vòng **to và quay**, khung ~560 vòng **nhỏ, chói**; khung `impact+80` cột sáng trên mục tiêu.
