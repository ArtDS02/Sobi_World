# Mẫu brief: Cu Ủn — "Gai Độc" (vertical slice, decision 040)

| Mục | Giá trị |
| --- | --- |
| Entity | Cu Ủn — heo, dòng Mộc Mẫu (`moc_mau`), hệ Thiên nhiên; body plan `quadruped` |
| Kỹ năng | `skill_mm_poison_thorn` "Gai Độc" — hybrid, Thiên nhiên, 1 kẻ địch, 8 MP, 70% Trúng độc |
| Pose / delivery | `cast` + `projectile` (khai trong `SKILL_MOTION`, hình `thorn`) |
| Trigger | `use` → `damage` → `status poison` (cùng beat) |
| Thời gian (thường) | 0 tụ lực · 260 bắn · 520 trúng (số bay, đẩy lùi, ánh tím) · 760 hồi xong. x2: ×0,55 |
| Art (khi có) | `fx_skill_mm_poison_thorn_projectile` (gai, hướng phải, 256²), `fx_skill_mm_poison_thorn_impact` (gai vỡ + khói độc, 256²) |
| Fallback | CSS: chấm sáng xanh tụ ở thân → gai xanh viền tím bay vồng → vụ nổ lá xanh |
| Không được | che thanh máu mục tiêu quá 1 khung; dùng tím Umbraflux cho phần chính (độc ≠ Umbraflux: chỉ chấm tím ở mũi gai) |

## Các pha (ảnh bằng chứng `art_inbox/sobi_adventure_reference/09_motion_slice/`)

| t (ms) | Cu Ủn | Hiệu ứng | Mục tiêu |
| --- | --- | --- | --- |
| 80 | bắt đầu nâng người | chấm sáng nhỏ ở thân | nghỉ |
| 220 | sáng lên, nhô cao | quả cầu tụ lực lớn nhất | nghỉ |
| 380 | đẩy tới | gai đang bay (giữa đường, vồng lên) | nghỉ |
| 520 | hồi về | gai chạm | bắt đầu bị đẩy |
| 600 | — | vụ nổ lá | đẩy lùi + loé, số "-103 Hiệu quả!" |
| 760 | đứng yên (idle) | tắt | ánh tím Trúng độc, chữ "Trúng độc" |

## Tiêu chí nghiệm thu

- [x] Impact trùng lúc số bay hiện (test + ảnh 600 ms)
- [x] Không khoá input, Auto chờ ≤ 3,2 s
- [x] Thiếu art vẫn chạy (đang chạy bằng fallback)
- [ ] Art gai thật (prompt 06) — chờ chủ dự án tạo
