# Kịch bản: Nước Mát (`skill_e_soothe`) — quái

```json scenario
{
  "id": "skill_e_soothe", "kind": "skill", "name": "Nước Mát", "element": "SUPPORT", "tier": 0, "durationMs": 1050,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/WATER"],
  "assets": [
    { "id": "fxs_drop", "state": "have", "layer": "L1" },
    { "id": "fx_bubble_pop", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (K3–K6)" },
    { "id": "fx_heal_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô xanh nước nhạt)" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Quái **nhắm mắt**, **giọt nước mát** hiện trên đầu, **bay tới đồng bọn**, **xoay một vòng quanh** nó rồi **vỡ thành gợn êm** + hồi máu. Cảm giác: mát, êm. Hồi 25 %, T0. Ếch Sương, Dê Tuyết.

## 2. Hiện tại
`fxs_drop` orbit. Audit: `STATIC_HERO`, `STATIC_SHARE`.

## 3. Kịch bản theo nhịp
| # | ms | Quái / đồng bọn | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Nhắm | 0–300 | nhắm mắt | giọt **phồng** trên đầu | "bloop" |
| 2 Bay + xoay | 300–700 | — | giọt bay tới, **xoay 1 vòng** quanh đồng bọn, giọt nhỏ rơi theo, giọt **méo** theo hướng | ngân |
| 3 Vỡ | 700 | đồng bọn nhún | giọt **vỡ** (K3–K6) + vòng hồi nở ở chân | chuông nước |
| 4 Dư âm | 700–1050 | idle | lấp lánh | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | giọt; vỡ | `fxs_drop` (0,35), `fx_bubble_pop` | `prop pop` 0–300 → `prop orbit` + `stretch` 300–700; `strip fx_bubble_pop frames [2,5]` 700 | 0–900 |
| L3 | giọt rơi theo; vòng hồi; lấp lánh | `fx_heal_bloom` | `trail drop_trail every 80`; `strip fx_heal_bloom` 700; `burst star_pop` 800 | 300–1050 |
| L4 | nhún | — | `move hop` 700 | 700–900 |
L1 đạt 3/3: biến hình (vỡ khung) · phụ sinh (giọt rơi) · vận tốc (orbit, méo).

## 5. Asset
`fx_bubble_pop`, `fx_heal_bloom` **mới**.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 nhắm; nhún · B3 giọt → orbit → vỡ · B4 vòng hồi, lấp lánh · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: giọt ở **hai phía khác nhau** của đồng bọn trong 2 khung pha 2.
