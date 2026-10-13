# asset/reference — ảnh tham khảo (không đưa vào game)

Mỗi Area một thư mục. Skill `image-to-asset` ghi nhận từng ảnh theo mã băm
(`.claude/skills/image-to-asset/references/reference-registry.json`); thêm hoặc đổi ảnh thì lần chạy sau sẽ
phân loại lại (`scripts/ref-check.mjs`).

| Thư mục | Nội dung | Loại |
|---|---|---|
| `sobi_farm/` | 2 sheet heo + 1 sheet môi trường của Sobi Farm | **CORE**: phong cách chuẩn của cả game (`style_reference_pigs_alt.png` là OUTLIER, kiểu bị loại) |
| `sobi_world/` | Mock-up Sảnh, props Sảnh, nhân vật đi; `plaza_layout_mock.png` = bố cục Sảnh mới của chủ dự án (decision 024) | CONTENT: bố cục và hình dáng; `scripts/cut-plaza.ts` cắt từ đây |
| `sobi_cloud/` | Mock-up Cloud: hạt, chậu, cây hoa, tầng mây, công trình, vật phẩm | CONTENT: chỉ gợi ý hình dáng |

Thêm ảnh mới: bỏ vào `sobi_<area>/` (ví dụ `sobi_adventure/`, `sobi_aquarium/`, `sobi_garden/`), đặt tên mô tả nội
dung (`enemies_forest.png`), không cần làm gì thêm. Ảnh nào muốn dùng làm **chuẩn phong cách** thì phải cùng phong
cách Sobi Farm; ảnh khác phong cách vẫn hữu ích để gợi ý hình dáng.

Art công trình Farm gốc nằm ở `asset/building/sobi_farm/`, art heo gốc ở `asset/animals/sobi_farm/`.
