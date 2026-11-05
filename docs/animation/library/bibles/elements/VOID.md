# Bible hệ HƯ KHÔNG (VOID)

Khuôn như [WATER](WATER.md). Màu: `elements.VOID` (`color #8c7cff`, `glow #e4dcff`); nét `swirl`, `boom fx_void_portal`, rung 5. **Lưu ý dữ liệu:** `spark` đang là `ice_pop` (hạt băng) — lệch nhận diện; đề xuất dùng `void_sparks` / `void_ring` (sửa ở P3).

## 1. Tính cách
Hư Không là **lực hút, không gian bị bẻ cong**. Đọc khi bỏ màu: vòng rỗng méo, mọi thứ **bị kéo vào tâm** rồi **bật ngược ra**, đối xứng, im lặng trước cú nổ.

## 2. Vật lý & chuyển động
| Yếu tố | Quy tắc | Act |
|---|---|---|
| Hình thành | không gian co lại: hạt và cả nền bị kéo về tâm | `burst void_ring` hút vào, `tint focus`, (P2: barrel / displacement méo nền) |
| Đường đi | xoáy, quỹ đạo vòng; hoặc xuất hiện tại chỗ | `prop orbit`, `move vanish/appear` |
| Va chạm | **sụp vào rồi bung ngược** (implode → explode), 1 nhịp lặng giữa | `strip fx_void_portal`, `stop` trước khi bung, `burst void_sparks` ra ngoài |
| Dư âm | vòng rỗng nhấp nháy tắt dần, đốm sáng trôi ngược vào tâm | `decal ring`, `burst void_*` |
| Mục tiêu | bị **kéo** về tâm trước rồi mới bị đẩy | `move` hút (x âm) rồi `knock` |

## 3. Nhịp mẫu
Xoáy T2: vòng mở 300 → hút 400 (gia tốc tăng) → **lặng 80 (stop)** → bung 100 + rung → vòng tắt 500. Hệ duy nhất có "khoảng lặng trước va chạm" làm chữ ký.

## 4. Hình chủ đạo sống
Nắm đấm hư không (`fxp_void_fist`), chuông trời (`fxp_sky_bell`), vòng linh (`fxp_spirit_circle`) tĩnh → xoay chậm + vành méo (pulse không đều) + hạt bị hút vào vật. Đây là hệ hợp nhất với shader **barrel** (méo không gian) — thử sau khi P2 chốt hướng shader.

## 5. Asset hiện có
Flipbook `fx_void_portal` [4]. Vật: `fxp_void_fist`, `fxp_sky_bell`, `fxp_spirit_circle`. Hạt: `void_sparks`, `void_ring`, `void_trail`.
**Thiếu:** flipbook vòng sụp → bung 6 khung.

## 6. Hiện trạng (audit)
| Skill | Bậc | Cờ | Hướng |
|---|---|---|---|
| `skill_ult_hk`, `skill_ult_mythical` | T4/T4 | STATIC_HERO, FEW_LAYERS | méo không gian, hạt hút vào, khoảng lặng trước bung; thêm L2 |
| `skill_hk_pure_impact` | T2/T3 | STATIC_HERO | kéo mục tiêu vào trước khi đánh |
| `skill_hk_void_vortex` | T1/**T4** | IMPACT_OVER_TIER, NO_AFTERMATH | hạ tác động về T1–T2; vòng tắt dần |

## 7. Cấm
Hạt băng / tuyết làm hạt chính (đang có qua `spark ice_pop`); nổ từ trong ra ngay không có hút; xanh dương lẫn hệ Nước (giữ tím-lam `#8c7cff`).
