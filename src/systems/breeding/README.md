# src/systems/breeding — Lai giống nâng cao (GĐ7)

Thuần, `rules` và rng truyền vào; dùng được cho heo, sau này cho cá.

| File | Việc |
|---|---|
| `traits.ts` | bảng tính trạng, tính trạng nhìn thấy / ẩn (lộ ở 5 tim), nhân hiệu ứng `growth` / `sellValue` / `bondGain`, cộng `mutation` |
| `inherit.ts` | `rollChildTraits`: di truyền từng tính trạng, tính trạng thường mới, đột biến (Hiếm / Sử thi), tính trạng riêng của loài, tối đa 3, ẩn một tính trạng Hiếm+; `mutationChance` |
| `pity.ts` | vận may: `applyPity` chuyển xác suất sang kết quả Rare+, `nextPity` (+bước khi lỡ, về 0 khi trúng, giữ nguyên khi cặp không thể ra Rare+) |
| `lineage.ts` | cây tổ tiên đóng băng, sâu `lineageDepth` đời |
| `rumors.ts` | tin đồn mỗi ngày của Nhà lai giống: gợi ý công thức chưa khám phá, không gọi tên loài |

Số liệu: `content/breeding/{balance,traits,rumors}.json` (Admin → Số liệu; mô phỏng ở Admin → Luật phối giống → Mô phỏng lai). Quyết định: `docs/decisions/014-advanced-breeding.md`.
