# Kịch bản: Chấn Động (`skill_cl_tremor`) — lớp Hộ Vệ

```json scenario
{
  "id": "skill_cl_tremor", "kind": "skill", "name": "Chấn Động", "element": "SELF", "tier": 2, "durationMs": 1450,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit", "elements/EARTH"],
  "assets": [
    { "id": "fx_crack_spread", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo hệ $color)" },
    { "id": "fx_stone_rise", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (size 0,6)" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô theo hệ $glow)" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Ba cú đập đất dồn dập** "dum-dum-DUM!", mỗi cú một **gợn chấn động** lan sang phe địch (to dần); nhịp ba **hất gai đá / hạt theo hệ** dưới chân từng quái. Cảm giác: nhịp trống, tích lũy. T2 diện rộng (hiện quá tay T4: rung 9). 30 % Choáng.

## 2. Hiện tại
`fx_rock_spike` dưới quái, rung 4/6/9. Audit: `IMPACT_OVER_TIER`.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Đập 1 | 0–180 | pose `attack`, đập | bụi vòng nhỏ; gợn 1 lan | — | rung 1 | "dum" |
| 2 Đập 2 | 180–360 | đập mạnh hơn | gợn 2 lan (to hơn) | lắc nhẹ | rung 2 | "dum" |
| 3 Đập 3 | 360–550 | **nhấc cao rồi đập** | gợn 3 to nhất **chạy** sang phe địch | — | — | "DUM!" |
| 4 Hất | 900 | — | gai đá + hạt theo hệ bật dưới từng quái (stagger 90) | nảy | hit-stop medium 70, rung 4 | "krak" ×n |
| 5 Dư âm | 900–1450 | idle | gai vỡ vụn; `st_stun` | — | — | sỏi |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | 3 gợn; gai | `fx_crack_spread` ($color) ×3 (size tăng), `fx_stone_rise` (0,6) | `strip under` 0, 180, 360 (alpha / size tăng); gợn 3 kéo dài tới phe địch 360–900; `strip fx_stone_rise` per target stagger 90 | 0–1100 |
| L3 | bụi; hạt theo hệ | `fx_dust_ring` ($glow) | `strip` ×3 ở chân heo; `burst $spark` per target | 0–1000 |
| L4 | rung tăng dần (thấp); hit-stop | — | `shake 1/2/4` (thay 4/6/9); `stop medium`; `move hop` targets | 0–1100 |
L1 đạt 2/3: biến hình (gợn lan, gai trồi khung) · vận tốc / nhịp (to dần).

## 5. Asset
`fx_crack_spread`, `fx_stone_rise`, `fx_dust_ring` **mới**; dự phòng `decal ring`, `fx_rock_spike`.

## 6. Các bước dựng
B1 nhịp `{ release 550, impact 900, end 1450 }` · B2 đập ×3 (nhịp 3 nhấc cao); quái nảy · B3 gợn ×3 → gai · B4 bụi, hạt · B5 **hạ rung về T2** · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `IMPACT_OVER_TIER`; capture: ba gợn ở ba khung **to dần**; gai dưới quái ở các khung khác nhau.
