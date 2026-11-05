# Kịch bản phản ứng: Nhật Thực (`reaction_eclipse`)

```json scenario
{
  "id": "reaction_eclipse", "kind": "reaction", "name": "Nhật Thực", "element": "VOID", "tier": 2, "durationMs": 900,
  "status": "draft", "refs": [], "bibles": ["elements/LIGHT", "elements/DARK", "elements/VOID"],
  "assets": [
    { "id": "fx_void_implode", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (đĩa đen viền sáng)" },
    { "id": "fx_star_bloom", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (quả cầu sáng)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Ánh sáng chạm bóng tối: **quả cầu sáng** hiện trước mục tiêu, **đĩa đen trượt che** như nhật thực 300 ms, **vòng sáng viền** quanh đĩa — rồi **bung** thành vòng tím trắng. Cảm giác: vũ trụ, trang nghiêm, "vwoom-TING". +25 % sát thương Hư Không, xóa trạng thái nguồn Bóng tối.

## 2. Hiện tại
`fx_void_portal` + `fx_boom` + split + âm: không có "che" kiểu nhật thực.

## 3. Kịch bản theo nhịp
| # | ms | Mục tiêu | Hiệu ứng | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Cầu sáng | 0–150 | — | quả cầu sáng **nở** trước thân | — | "ting" |
| 2 Che | 150–450 | khựng | **đĩa đen trượt** từ trái che cầu sáng, chỉ còn **vòng sáng viền** | tối quanh 0,3 | "vwoom" trầm |
| 3 Bung | 450 | bật lùi | đĩa **sụp rồi bung** vòng tím trắng | hit-stop light 60, tách màu 80, rung 3 | "TING" |
| 4 Dư âm | 450–900 | — | sao tím trắng rơi | — | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | cầu sáng; đĩa đen | `fx_star_bloom` (hold khung sáng nhất), `fx_void_implode` (tô đen viền sáng) | cầu 0–450; đĩa: `strip frames [3,3]` trượt ngang 150–450 (cần `prop` dùng khung — dùng `fxp_lumina_ring` tô đen nếu chưa có `prop_flipbook`) → `frames [4,5]` 450 |
| L2 | tối quanh | — | `tint focus 0.3` 150–450 |
| L3 | sao | `fxs_star` | `burst star_fall tint` tím trắng 500 |
| L4 | hit-stop, tách màu | — | `stop light`; `split 80`; `shake 3`; `move knock x 12` |

## 5. Asset
`fx_void_implode`, `fx_star_bloom` **mới**.

## 6. Các bước dựng
B1 ≤ 900 · B2 khựng / bật · B3 cầu → che → bung · B4 sao · B5 hit-stop light + tách màu · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~350 chỉ còn **vòng sáng viền** quanh đĩa đen.
