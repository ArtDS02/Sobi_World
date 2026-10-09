# src/app — composition root

Ghép mọi lớp: `main.ts`/`start.ts` khởi động, `areas.ts` đăng ký Area, `gameStore.ts` dựng store với `platform`,
`saveCodec.ts` mã hóa save theo Area đã đăng ký, `runtime.ts` cấu hình chạy. Đây là nơi duy nhất được biết cả Farm lẫn core.
