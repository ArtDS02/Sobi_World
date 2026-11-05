# Kịch bản: Địa Chấn Phong Ấn (`skill_e_seal_quake`) — trùm Hộ Pháp Cổ Đại (dưới 50 % máu)

```json scenario
{
  "id": "skill_e_seal_quake", "kind": "skill", "name": "Địa Chấn Phong Ấn", "element": "EARTH", "tier": 2, "durationMs": 2100,
  "status": "draft", "refs": [], "bibles": ["elements/EARTH", "actions/idle-and-states"],
  "assets": [
    { "id": "fxp_seal_circle", "state": "have", "layer": "L1" },
    { "id": "fx_light_pillar", "state": "have", "layer": "L1" },
    { "id": "fx_stone_rise", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_crack_spread", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô vàng đất)" },
    { "id": "fx_rock_burst", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Trùm **đặt hai tay xuống đất** (đổi pha), mắt sáng; **vòng phong ấn được VẼ DẦN** dưới phe ta; nét rune **dựng lên thành hàng rào sáng**; **lặng**; rồi **đất nổ** dưới từng con. Cảm giác: nghi thức cổ, áp lực dồn tới nổ. T2 diện rộng (power 1,3), 25 % Choáng. Tác động đã hạ (medium, rung 4).

## 2. Hiện tại
`fxp_seal_circle grow` (ảnh to dần) + rune + nổ; 2400–2600 ms. Audit: `STATIC_HERO`, `STATIC_SHARE`, `DURATION_OVER`.

## 3. Kịch bản theo nhịp
| # | ms | Trùm | Hiệu ứng chính | Phe ta | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Đổi pha | 0–500 | đặt 2 tay xuống, mắt sáng, rung nhẹ | — | — | tối 25 % | tụng trầm |
| 2 Vẽ vòng | 500–1000 | — | vòng phong ấn **vẽ dần** theo cung (wipe quay 0 → 360°) dưới phe ta, khe sáng | nhìn xuống | — | rì rầm |
| 3 Hàng rào | 1000–1400 | — | nét rune **dựng lên** thành cột sáng vàng đất ở từng con | bị nhốt | — | ngân |
| 4 Lặng | 1400–1450 | — | mọi thứ khựng | — | im | — |
| 5 Nổ | 1450 | — | **đất nổ** dưới từng con: đá trồi + vỡ + nứt (stagger 100) | hất lên | hit-stop medium 80, punch 1,02, rung 4 | "KRA-KOOM" |
| 6 Dư âm | 1450–2100 | đứng dậy | vòng tắt, bụi; `st_stun` | ngồi dậy | nền về | sỏi |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | tối nền | — | `tint #200818 0.25` | 0–1900 |
| L1 | vòng phong ấn; cột sáng; đá trồi | `fxp_seal_circle` (`under`), `fx_light_pillar` (vàng đất), `fx_stone_rise` | vòng: `prop grow` + `spin 0.5` + alpha tăng theo cung (nếu chưa có wipe: grow từ 0 + quay) 500–1000, tắt 1500–1900; `strip fx_light_pillar hold 300` per target 1000–1400; `strip fx_stone_rise` per target stagger 100 1450 | 500–1900 |
| L2 | mắt trùm sáng | — | `glow #ffd36a` 0–500 | 0–500 |
| L3 | nứt; đá vỡ | `fx_crack_spread` (vàng đất), `fx_rock_burst` (0,6) | `strip under` 1450; `strip fx_rock_burst` per target 1550 | 1450–2000 |
| L4 | lặng → nổ | — | `stop medium` (đã hạ); `shake 4`; `punch 1.02`; `move lift` stagger 100 | 1400–1800 |
L1 đạt 3/3: biến hình (vẽ dần, cột, đá khung) · phụ sinh (nứt, đá) · vận tốc (quay, dựng).

## 5. Asset
`fx_stone_rise`, `fx_crack_spread`, `fx_rock_burst` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp `{ release 1000, impact 1450, end 2100 }` (rút 300) · B2 trùm đặt tay / đứng dậy; phe ta nhìn xuống, hất · B3 vòng → cột → đá · B4 nứt, đá vỡ · B5 lặng 50 → nổ · B6 âm · B7 capture (case trùm đổi pha).

## 7. Nghiệm thu
Audit hết `DURATION_OVER`, `STATIC_HERO`; capture: khung ~700 vòng **vẽ dở**; khung ~1420 gần như đứng yên.
