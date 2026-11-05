# Kịch bản: Lao Sấm (`skill_e_thunder_charge`) — quái Cừu Sừng Sấm

```json scenario
{
  "id": "skill_e_thunder_charge", "kind": "skill", "name": "Lao Sấm", "element": "LIGHTNING", "tier": 2, "durationMs": 1450,
  "status": "draft", "refs": [], "bibles": ["elements/LIGHTNING", "actions/melee-and-hit"],
  "assets": [
    { "id": "fx_slash_long", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô vàng; 2 vệt chéo chữ X mỗi con)" },
    { "id": "fx_spark_arc", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_bolt_mini", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Cừu **cúi đầu, len xù tích điện**; **lao zig-zag xuyên qua cả đội**, vệt sét kéo theo, mỗi con **lóe chữ X**; **phanh** ở mép trái rồi chạy vòng về. Cảm giác: điên cuồng, nhanh, "zzZAP ×n". T2 diện rộng, 15 % Choáng.

## 2. Hiện tại
`dash_through` + `fx_slash_arc` chung. Audit: `SHARED_FLIPBOOK_HERO` (dư âm đã thêm).

## 3. Kịch bản theo nhịp
| # | ms | Cừu | Hiệu ứng chính | Phe ta | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Tích | 0–400 | cúi đầu, **len xù** 1,1, cào chân | 8 tia nhỏ lách tách trong len | — | — | sấm rền |
| 2 Lao | 400–1000 | lao **zig-zag** xuyên qua từng con (đường lệch dọc ±15) | vệt sét vàng theo sau | mỗi con: **chữ X** vàng khi bị xuyên (stagger theo vị trí) | hit-stop light 40 mỗi con, chớp 0,15 một lần | "zzZAP" ×n |
| 3 Phanh | 1000–1150 | phanh trượt ở mép trái, quay đầu | bụi + tia | — | — | "skrt" |
| 4 Về | 1150–1450 | chạy vòng về chỗ | hồ quang trên các con trúng; `st_stun` nếu gắn | — | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | chữ X mỗi con | `fx_slash_long` ×2 (vàng, chéo + `flip`) | `strip` per target theo thời điểm cừu đi qua | 450–1000 |
| L2 | vệt sét | — | `trail #ffe14a every 30` | 400–1000 |
| L3 | tia trong len; hồ quang | `fxs_bolt_mini`, `fx_spark_arc` | `burst bolt_pop` 0–400; `strip fx_spark_arc size 0.5` per target 1000 | 0–1450 |
| L4 | hit-stop mỗi con; rung nhẹ | — | `stop light` per target; `shake 3` (từ 6); chớp 1 lần | 450–1000 |
Thân cừu (zig-zag xuyên, phanh) + chữ X khung: đạt 2/3 + phụ sinh (vệt sét).

## 5. Asset
`fx_slash_long`, `fx_spark_arc` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 400, impact 450, end 1450 }`, stagger theo đường đi · B2 tích, lao, phanh, về · B3 chữ X · B4 tia, hồ quang · B5 hit-stop light, rung 3 · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `SHARED_FLIPBOOK_HERO`; capture: cừu ở **giữa phe ta** ở khung ~700; chữ X ở các con theo thứ tự.
