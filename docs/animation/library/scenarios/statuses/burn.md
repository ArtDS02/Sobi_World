# Kịch bản trạng thái: Bỏng (`burn`)

```json scenario
{
  "id": "burn", "kind": "status", "name": "Bỏng", "element": "FIRE", "tier": 0, "durationMs": 500,
  "status": "draft", "refs": [], "bibles": ["elements/FIRE", "actions/status"],
  "assets": [
    { "id": "fx_flame_loop", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (nhỏ 0,35, bám chân / đuôi)" },
    { "id": "fx_fire_blast", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (0,6, lúc dính)" },
    { "id": "fxs_ember", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Lửa **bám** vào chân, con **nhảy dựng**; khi còn hiệu lực **lửa nhỏ cháy liên tục** ở chân, **tàn bay lên**, thân **tint đỏ**; mỗi lần mất máu lửa **bùng** một nhịp. Rubric MUST-HAVE: "lửa bám người + tàn lửa + tint đỏ".

## 2. Hiện tại
apply: `fx_flame_burst` + nhảy; loop **600 ms**: tàn + `fx_flame_burst` (nổ 4 khung lặp lại mỗi 0,6 s — nhấp nháy dày, không phải "cháy liên tục"); expire: khói + tàn; tint.

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| Dính | 0–500 | **nhảy dựng** 14 px, tint đỏ | nổ lửa nhỏ ở chân → lửa **bám** lại | "fwip!" |
| Duy trì | liên tục + mỗi 1,2 s | thỉnh thoảng phẩy chân | **lửa loop** nhỏ ở chân (cháy liên tục, không nhấp); 1 tàn bay lên mỗi 1,2 s | lách tách nhỏ (tùy chọn) |
| Mất máu (`dot_burn`) | ≤ 400 | giật + thổi | lửa **bùng to** 1 nhịp + tàn | "xèo" |
| Hết | 300–500 | phủi người | lửa tắt thành **khói xám** bốc lên | "phù" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | lửa bám (loop); nổ lúc dính | `fx_flame_loop` (0,35, `feet`), `fx_fire_blast` (0,6) | lửa loop là **layer** của status (thay loop nổ 0,6 s) |
| L2 | tint đỏ | — | status `tint #ff9a4a` |
| L3 | tàn; khói | `fxs_ember` | loop `burst ember_rise more 0.3` mỗi 1,2 s; expire `burst fire_smoke` |
| L4 | nhảy / giật | — | `move hop`; `dot_burn` `move shake` |

## 5. Asset
`fx_flame_loop`, `fx_fire_blast` **mới**. Cần engine cho phép status `layers` dùng flipbook lặp (`strip` loop) — nếu chưa: `loop.every 330` với `strip fx_flame_loop` liền nhau (không nhấp vì loop liền mạch).

## 6. Các bước dựng
B1 apply ≤ 500, loop thưa (1,2 s) + lửa liên tục · B2 nhảy, phẩy, giật · B3 lửa loop · B4 tàn, khói · B5 không rung · B6 âm · B7 capture (apply / loop / expire / dot).

## 7. Nghiệm thu
Capture loop: không còn chớp nổ lặp mỗi 0,6 s (`FLASH_RATE` sạch); lửa ở chân **đổi hình** giữa các khung; khác `poison` về hướng (lên) và hình (lửa / tàn).
