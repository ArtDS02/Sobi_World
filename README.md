# Sobi World

*Grow Your World. Discover Your Adventure.*

Game cozy life simulation cho desktop, chơi đơn, offline hoàn toàn. Người chơi đi lại trong **Sảnh Sobi** và các Area:
Sobi Farm 🐷 · Sobi Garden 🌱 · Sobi Aquarium 🐟 · Sobi Cloud ☁️ · Sobi Adventure ⚔️.
Phát triển tiếp từ game nuôi heo **Sobi Farm** (Area đầu tiên).

## Tài liệu

| File | Nội dung |
|---|---|
| [docs/SOBI_WORLD_PROJECT_SPEC_V2.md](docs/SOBI_WORLD_PROJECT_SPEC_V2.md) | Spec gameplay (nguồn sự thật) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Cấu trúc source, quy tắc kỹ thuật |
| [docs/GAME_BALANCE.md](docs/GAME_BALANCE.md) | Con số khởi điểm |
| [docs/ROADMAP.md](docs/ROADMAP.md) | 13 giai đoạn |
| [docs/AGENT_RULES.md](docs/AGENT_RULES.md) | Luật làm việc cho AI agent |
| [docs/HUONG_DAN_TRIEN_KHAI.md](docs/HUONG_DAN_TRIEN_KHAI.md) | Prompt từng giai đoạn |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Trạng thái hiện tại |
| [docs/decisions/](docs/decisions/) | Quyết định đã chốt |
| [docs/archive/sobi-farm/](docs/archive/sobi-farm/) | Tài liệu Sobi Farm cũ (README cũ có chi tiết lưu game, asset, credits) |

## Lệnh

| Việc | Lệnh |
|---|---|
| Cài thư viện (lần đầu, cần mạng) | `npm ci` |
| Dev trong trình duyệt (`?dev=1`: tua giờ, xem asset) | `npm run dev` |
| Dev desktop (Electron) | `npm run dev:desktop` |
| Admin dashboard (chỉ bản phát triển) | `npm run admin` |
| Cổng chất lượng: typecheck + lint + guard kiến trúc + asset + unit test | `npm run check` |
| Unit test | `npm test` |
| Smoke e2e trên bản build | `npm run test:e2e` |
| Mô phỏng kinh tế | `npm run sim:economy` |
| Installer Windows → `release/` | `npm run dist:win` |

## Credits

Hình và hiệu ứng âm thanh: tác phẩm gốc của dự án (vẽ/tổng hợp bằng code và cắt từ sheet tham chiếu của dự án).
Nhạc nền `music_farm`: tạo bằng Mureka AI cho dự án. Chi tiết: `docs/archive/sobi-farm/README.md` mục Credits.
