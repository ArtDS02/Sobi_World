# Kịch bản trạng thái: Trúng độc (`poison`)

```json scenario
{
  "id": "poison", "kind": "status", "name": "Trúng độc", "element": "NONE", "tier": 0, "durationMs": 600,
  "status": "draft", "refs": [], "bibles": ["motifs/poison", "actions/status"],
  "assets": [
    { "id": "fx_smoke_curl", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô xanh độc #7be08a pha tím, nhỏ, thấp)" },
    { "id": "fxs_spore", "state": "have", "layer": "L3" },
    { "id": "fxs_bubble", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Độc **âm ỉ, sủi bọt**: lúc dính bào tử phụt quanh thân, mặt **tái xanh tím**; khi còn hiệu lực **bọt sủi vỡ lụp bụp** quanh chân, khói xoăn thấp; mỗi lần mất máu thân **co lại "ực"**. Tối đa 3 tầng: icon to hơn, thêm chấm. Bible [poison](../../bibles/motifs/poison.md).

## 2. Hiện tại
apply: bào tử + glow tím; loop 700: bào tử bay lên + bọt xanh; expire: `fx_poof` xanh + …; tint. Đạt 3 pha (vòng 4), nhưng bọt chỉ **bay lên**, không **vỡ**; `dot_poison` dùng chung squash.

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| Dính | 0–600 | rùng mình, mặt tái (tint xanh tím 200 ms) | 3 bào tử **phụt** quanh thân; bọt nhỏ trồi từ chân lên | "blub" |
| Duy trì | mỗi 1,8 s, ≤ 400 | — | 1–2 bọt **sủi lên rồi vỡ** ở chân + khói xoăn thấp (tầng 2–3: dày hơn) | không |
| Mất máu (`dot_poison`) | ≤ 400 | **co "ực"** (squash 0,94) + lắc nhỏ | bọt vỡ chùm + số | "ực" |
| Hết | 300–450 | thân sáng lại (tint tan 300 ms) | bọt cuối vỡ, khói tan lên | ngân nhẹ |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | khói độc thấp quanh chân | `fx_smoke_curl` (xanh tím, 0,6, `under`) | loop khi duy trì (alpha 0,5) |
| L2 | tint thân | — | status `tint #9a6ad6` |
| L3 | bào tử; bọt sủi / vỡ | `fxs_spore`, `fxs_bubble` (tô `#7be08a`) | `burst spore_pop` lúc dính; loop `burst bubble_rise` → `bubble_pop` sau 300 ms |
| L4 | co "ực" | — | `move squash 0.94` ở `dot_poison` |

## 5. Asset
`fx_smoke_curl` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp như bảng · B2 rùng mình, co ực · B3 khói thấp · B4 bọt sủi → vỡ · B5 không rung · B6 âm · B7 capture (apply / loop / expire / dot).

## 7. Nghiệm thu
Loop khác `burn` về **hướng** (độc: sủi tại chỗ / lơ lửng thấp; bỏng: bay lên) và **hình** (bọt vs tàn lửa); không lẫn hồi máu (không dấu cộng, không xanh lá thuần).
