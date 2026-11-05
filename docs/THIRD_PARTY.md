# THIRD PARTY — Nguồn và giấy phép bên thứ ba (AGENT_RULES §9)

Mọi font, âm thanh, thư viện, ảnh không do dự án tự tạo phải có dòng ở đây. Trạng thái: **bản đầu, cần chủ dự án/luật sư xác nhận**.

| Thành phần | Dùng ở | License | Ghi chú |
|---|---|---|---|
| `@fontsource/baloo-2` (Baloo 2) | UI | OFL-1.1 | Dùng thương mại được; không bán riêng font; giữ file license khi đóng gói |
| `phaser` | game | MIT | |
| `idb` | lưu trữ | ISC | |
| `zod` | schema | MIT | |
| `electron` (+ `electron-builder`) | bản desktop | MIT | |
| `music_farm` (`asset/music/music-bg.mp3`) | nhạc nền | **Chưa xác minh** | Sinh bằng Mureka AI theo gói của chủ dự án; cần lưu điều khoản gói + xác nhận cho phép thương mại |
| SFX `scripts/art/sfx.ts` | âm thanh | Tự tạo | Tổng hợp bằng code |
| Art trong `public/assets` | game | Tự tạo/AI do chủ dự án | Phải tuân §9: không IP bên thứ ba |

TODO: chạy công cụ liệt kê license cho toàn bộ dependency (kể cả gián tiếp) trước phát hành; tra cứu nhãn hiệu "Sobi World".
