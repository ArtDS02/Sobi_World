# Motif ĐỘC (poison)

Dùng cho status `poison`, action `dot_poison`, skill gắn độc (`skill_mm_poison_thorn`, `skill_e_poison_spore`, `skill_e_corrupt_bloom`…). Thuộc hệ Thiên nhiên về nguồn gốc nhưng hình riêng. Màu đang dùng: tím `#9a6ad6` (tint thân) + xanh bọt `#7be08a` / `#7ad05a`.

## 1. Tính cách
Độc **âm ỉ, sủi, lan chậm, tái đi**. Đọc khi bỏ màu: **bọt sủi** nổi lên vỡ lụp bụp, khói xoăn lơ lửng thấp, thân sinh vật **co lại** mỗi lần mất máu. Không nổ, không chớp.

## 2. Ba pha (rubric MUST-HAVE "Độc: tái màu + bọt / khói độc + hiệu ứng mỗi lần mất máu")
| Pha | Hiện có | Chuẩn |
|---|---|---|
| Dính (apply) | `spore_pop` + glow tím 200 ms | thêm bọt nhỏ trồi từ chân lên + thân rùng 1 nhịp |
| Duy trì (loop 700 ms) | `spore_rise` + bọt xanh | giữ; bọt **vỡ** ở đỉnh (pop) chứ không chỉ bay lên |
| Mất máu (`dot_poison`) | bào tử + glow tím + squash 0,94 | giữ; thêm "ực" (move shake nhỏ) để khác hẳn bỏng |
| Hết (expire) | `fx_poof` xanh + … | thân sáng lại (tint tan dần 300 ms), bọt cuối vỡ |

## 3. Phân biệt với hệ khác
| | Độc | Bóng tối | Thiên nhiên thường |
|---|---|---|---|
| Hướng | lên chậm, lơ lửng thấp | lan ngang, co về | rơi lả tả |
| Hình | bọt tròn sủi, khói xoăn | khối mực đặc | lá, cánh hoa |
| Màu | tím + xanh bọt | tím than | xanh lá |

## 4. Cấm
Độc trông như hồi máu (xanh lá + bay lên mềm + dấu cộng); khói độc che mặt sinh vật; hình đầu lâu / xương (game cozy).
