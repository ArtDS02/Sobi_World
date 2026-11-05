# Kịch bản: Tinh Thần Bất Khuất (`skill_cl_undying`) — lớp Hỗ Trợ

```json scenario
{
  "id": "skill_cl_undying", "kind": "skill", "name": "Tinh Thần Bất Khuất", "element": "SUPPORT", "tier": 0, "durationMs": 1250,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fxs_heart", "state": "have", "layer": "L1" },
    { "id": "fx_star_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (vàng ấm)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Heo **đặt tay lên ngực**, **trái tim vàng** sáng lên, **bay tới bạn**, **tách thành dải ruy băng sáng thắt nút** quanh ngực bạn; tim **đập hai nhịp** "thump-thump". Cảm giác: ấm, hứa hẹn, kiên cường. Tự hồi sinh, T0.

## 2. Hiện tại
`fxs_heart` bay. Audit: `STATIC_HERO`, `STATIC_SHARE`.

## 3. Kịch bản theo nhịp
| # | ms | Heo / bạn | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Tim | 0–300 | pose `cast`, tay lên ngực | **tim vàng** hiện trước ngực, **đập 1 nhịp** | "thump" |
| 2 Bay | 300–650 | — | tim bay vồng tới bạn, nhấp nhô, vệt vàng | — |
| 3 Thắt | 650–850 | bạn ưỡn ngực | tim **tách** thành dải sáng **quấn vòng** quanh ngực rồi **thắt nút** (nở sao nhỏ) | "thump-thump" |
| 4 Dư âm | 850–1250 | idle | lấp lánh vàng; `st_revive` | hợp âm ấm |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | tim; dải ruy băng | `fxs_heart` (vàng, 0,35), dải = `ribbon` code | tim `prop pop` + `pulse amp 0.15 freq 2` 0–300 → `throw` arc 50 300–650 → `pulse` ×2 650–850; `ribbon` ngắn vàng quấn quanh `chest` (thickness 0,05, length 0,15) 650–850 | 0–900 |
| L2 | — | — | — | — |
| L3 | nút sao; lấp lánh | `fx_star_bloom` (0,5), `fxs_star` | `strip fx_star_bloom` 830; `burst star_fall` 900 | 830–1250 |
| L4 | bạn ưỡn | — | `move puff_up 1.06` 650 (không rung) | 650–900 |
L1 đạt 3/3: biến hình (tim đập, dải quấn) · phụ sinh (sao) · vận tốc (vồng).

## 5. Asset
`fx_star_bloom` **mới**.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 tay lên ngực; bạn ưỡn · B3 tim → bay → dải · B4 nút sao, lấp lánh · B5 không rung · B6 âm tim đập · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO` (dải ribbon + tim đập); capture: khung ~750 dải **quấn quanh ngực** bạn.
