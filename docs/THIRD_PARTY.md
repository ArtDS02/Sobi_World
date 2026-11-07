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
| Unity 6 (6000.6.8f1), giấy phép Personal | `studio/` (xưởng art offline, decision 051) | Unity Personal (điều khoản Unity) | Chỉ là công cụ, **không đi kèm game**; chỉ dùng module có sẵn của Editor, không package Asset Store; mọi hình dựng bằng code của dự án. Điều kiện Personal: doanh thu + vốn < 200.000 USD / 12 tháng |

TODO: chạy công cụ liệt kê license cho toàn bộ dependency (kể cả gián tiếp) trước phát hành; tra cứu nhãn hiệu "Sobi World".
