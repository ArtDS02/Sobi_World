# Kịch bản hành động: Bị trúng đòn (`hit`)

```json scenario
{
  "id": "hit", "kind": "action", "name": "Bị trúng đòn", "element": "NONE", "tier": 2, "durationMs": 480,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit"],
  "assets": [
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo hệ đòn; bỏ khi đòn đã có va chạm riêng)" },
    { "id": "fxs_drop", "state": "have", "layer": "L3" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": ["action_by_body"]
}
```

## 1. Ý tưởng
Bị đánh **văng nhẹ**, **mặt mếu**, **nước mắt bắn** — dễ thương, không đau đớn. Phản ứng **theo hướng đòn** và **theo kiểu thân** (bay bị đẩy lên, nặng chỉ lùi ít). Đây là phản ứng xuất hiện nhiều nhất trong trận.

## 2. Hiện tại
`actions.hit`: `burst $spark` (đã đổi từ giọt nước, 2026-11-05) + âm; phản ứng thân trong code (`battlePose.ts`: hurt + lò xo). Thiếu nước mắt (đã có `tears` ở `battlePlan`), không theo kiểu thân.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Chạm | 0–70 | pose `hurt`, **chớp trắng** (trong hit-stop của đòn) | hạt theo hệ đòn | "pok!" |
| 2 Bật | 70–300 | **lùi 24** + nghiêng 10° theo hướng đòn, squash 0,9 → 1,04 | 4 giọt nước mắt **bắn ngang** + 3 sao nhỏ | "eek" nhỏ |
| 3 Về | 300–480 | lò xo về, **run nhẹ** 3 lần | — | — |
Kiểu thân: bay → đẩy **lên** 10; nặng → lùi **12**; bơi → xoay ngang 15°.

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | va chạm (khi đòn chưa có) | `fx_hit_burst` | `strip` tô `$glow` |
| L2 | chớp trắng thân | — | `glow #ffffff` 70 ms |
| L3 | nước mắt; sao | `fxs_drop`, `fxs_star` | `burst tears`; `burst star_pop more 0.3` |
| L4 | bật lùi theo hướng + lò xo | — | code `battlePose.ts` (theo hướng); biến thể theo `bodies` cần `action_by_body` |

## 5. Asset
`fx_hit_burst` **mới**.

## 6. Các bước dựng
B1 ≤ 480 · B2 bật theo hướng + kiểu thân · B3 va chạm khi cần · B4 nước mắt, sao · B5 hit-stop thuộc về đòn · B6 âm · B7 capture (đánh thường vào 4 kiểu thân).

## 7. Nghiệm thu
Capture `impact+80`: mục tiêu lệch **theo hướng đòn**; chim bị đẩy **lên**, quái nặng lùi ít hơn.
