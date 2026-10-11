# src/app — composition root

Ghép mọi lớp: `main.ts`/`start.ts` khởi động, `areas.ts` đăng ký Area, `gameStore.ts` dựng store với `platform`,
`saveCodec.ts` mã hóa save theo Area đã đăng ký, `runtime.ts` cấu hình chạy. Đây là nơi duy nhất được biết cả Farm lẫn core.

GĐ13: `main.ts` đọc `settings.json` trước khi nạp game để chọn ngôn ngữ (`i18n/language.ts` đổ bảng chuỗi tiếng Anh lên `vi`, `core/content/load.ts` nhận bộ dịch chữ trong `content/*.json`); `display.ts` nối cỡ chữ, chế độ màu, rung màn hình và ngôn ngữ với kho cài đặt (đổi ngôn ngữ thì lưu save rồi tải lại màn hình).
