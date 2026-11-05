# Kịch bản phản ứng: Vỡ Băng (`reaction_shatter`)

```json scenario
{
  "id": "reaction_shatter", "kind": "reaction", "name": "Vỡ Băng", "element": "WATER", "tier": 3, "durationMs": 900,
  "status": "draft", "refs": ["REF-ICE-ENCASE-001"], "bibles": ["motifs/ice"],
  "assets": [
    { "id": "fx_ice_shatter", "state": "have", "layer": "L1" },
    { "id": "fx_crack_spread", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô trắng, 3 đường nứt trên vỏ băng)" },
    { "id": "fxs_ice_shard", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Mục tiêu **đang Đóng băng** trúng đòn vật lý / Lửa: vỏ băng **nứt 3 đường** (khựng), rồi **nổ tung** mảnh sắc văng thẳng; mục tiêu **văng xa** như trúng mạnh. Cảm giác: giòn, thỏa mãn, "KRSSH!". Sát thương ×1,5.

## 2. Hiện tại
stop 160 (vượt rubric), punch 1,05, rung 10, `fx_ice_shatter`, mảnh, knock 44. Đã mạnh (bible ice: giữ), thiếu **khung nứt** trước khi vỡ; hit-stop / rung quá khoảng.

## 3. Kịch bản theo nhịp
| # | ms | Mục tiêu | Hiệu ứng | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Nứt | 0–100 | khựng | **3 đường nứt sáng** lan trên vỏ băng | hit-stop medium 100 | "krk-krk" |
| 2 Vỡ | 100 | — | vỏ **nổ** 1,3× + 16 mảnh sắc văng **thẳng** | punch 1,05, rung 6, chớp trắng 0,2 | "KRSSH!" |
| 3 Văng | 100–700 | **văng 44**, nảy | mảnh rơi xuống đất, tan | — | leng keng |
| 4 Dư âm | 700–900 | ngồi dậy rùng mình | sương lạnh tan | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | nứt; vỡ | `fx_crack_spread` (trắng, `chest`, xoay đứng), `fx_ice_shatter` (1,3) | nứt 0–100; vỡ 100 |
| L3 | mảnh | `fxs_ice_shard` | `burst ice_pop more 2` 100; `burst ice_fall` 400 |
| L4 | hit-stop, punch, rung, văng | — | `stop medium 100` (từ 160); `punch 1.05`; `shake 6` (từ 10); `flash 0.2`; `move knock x 44` |

## 5. Asset
`fx_crack_spread` **mới**; còn lại có.

## 6. Các bước dựng
B1 ≤ 900 · B2 khựng → văng → ngồi dậy · B3 nứt → vỡ · B4 mảnh · B5 hit-stop 100, rung 6 · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: một khung **nứt** trước khung vỡ; `HITSTOP_RANGE` sạch; mảnh văng **thẳng** (không tròn mềm).
