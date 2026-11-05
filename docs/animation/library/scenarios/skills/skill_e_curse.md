# Kịch bản: Lời Nguyền (`skill_e_curse`) — quái hồn ma / thầy tế

```json scenario
{
  "id": "skill_e_curse", "kind": "skill", "name": "Lời Nguyền", "element": "DARK", "tier": 1, "durationMs": 1400,
  "status": "draft", "refs": [], "bibles": ["elements/DARK", "actions/status"],
  "assets": [
    { "id": "fxp_curse_eye", "state": "have", "layer": "L1" },
    { "id": "fx_debuff_sink", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_ink_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (nhỏ, khi mắt tan)" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
Giơ trượng, **mắt lóe tím**; trên đầu từng con phe ta **mắt nguyền mở** (mí từ từ hé), vòng rune **xoay ngược**; **mắt chớp một cái** — tất cả **xìu xuống**, khói xám chảy xuống người. Cảm giác: âm u, nhẹ nhàng nhưng khó chịu. T1 diện rộng (power 0,4), Giảm Công / Công phép.

## 2. Hiện tại
`fxp_curse_eye` (ảnh) + rũ + tối; không mốc va chạm. Audit: `STATIC_HERO`, `STATIC_SHARE`, `NO_AFTERMATH`.

## 3. Kịch bản theo nhịp
| # | ms | Quái | Hiệu ứng chính | Phe ta | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Giơ trượng | 0–400 | giơ trượng, mắt lóe tím | — | — | tối dần 20 % | thì thầm |
| 2 Mở mắt | 400–900 | — | mắt nguyền **mở dần** (scale y 0,1 → 1) trên đầu từng con (stagger 120), mép gợn, vòng rune xoay ngược | ngước, run | — | rì rầm |
| 3 Chớp | 900 | — | mắt **chớp** (y 1 → 0,1 → 1 trong 120 ms) | **xìu xuống** sy 0,92, tô tối | hit-stop light 40 | "blink" |
| 4 Dư âm | 900–1400 | idle | mắt **tan** thành mực nhỏ; **khói xám chảy xuống** người; `st_atk_down`, `st_matk_down` | — | nền về | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | tối nền | — | `tint #100818 0.2` | 0–1300 |
| L1 | mắt nguyền | `fxp_curse_eye` (0,35) | `prop pop` + `stretch` dọc (mở mí) + `prop_displace` mép 400–900; chớp: `pulse` trục y một nhịp 900–1020; tan 1100 | 400–1150 |
| L2 | mắt quái lóe; vòng rune | — | `glow #d9b8ff` actor 0–400; `decal rune` dưới mắt quay ngược | 0–900 |
| L3 | mực khi mắt tan; khói xuống | `fx_ink_bloom` (0,4), `fx_debuff_sink` | `strip fx_ink_bloom frames [3,5]` 1100; `strip fx_debuff_sink` per target 950 | 950–1400 |
| L4 | xìu; hit-stop nhẹ | — | `move squash 0.92` per target; `stop light 40` | 900–1200 |
L1 đạt 3/3 (khi có displacement): biến hình (mở / chớp / tan) · phụ sinh (khói) · vận tốc (mở dần).

## 5. Asset
`fx_debuff_sink`, `fx_ink_bloom` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 400, impact 900, end 1400 }` · B2 giơ trượng; phe ta run, xìu · B3 mắt mở → chớp → tan · B4 rune, mực, khói · B5 hit-stop light (mốc va chạm) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết 3 cờ; capture: mắt **hé** ở khung ~500, **mở hẳn** ở ~850; khung ~950 phe ta thấp hơn.
