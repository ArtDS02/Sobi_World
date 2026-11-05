# Prompt khởi động (copy nguyên văn vào session mới)

Mỗi prompt đủ ngắn vì mọi chi tiết nằm ở `roles/*.md` và `STATE.json`. Session luôn tự kiểm `phase` — mở nhầm role sẽ tự dừng.
Chủ dự án chỉ cần nhìn `STATE.json → phase` để biết mở role nào: `needs_harness`/`needs_capture` → Tester · `needs_review` → TD · `needs_fix` → Developer.

## Session 0 — Tester (BUILD lần đầu, RUN các vòng sau)
```
Vai trò: Senior Tester cho quy trình animation review của Sobi World.
Đọc và làm đúng `docs/animation-review/roles/0-tester.md`. Bắt đầu bằng `docs/animation-review/STATE.json`.
Harness đã xây xong: thường là chế độ RUN (xem `phase`; BUILD/mở rộng chỉ khi `needs_harness`). Không tin ký ức hay ảnh cũ; tuân `ANTI_CACHE.md`.
Kết thúc theo Definition of Done, cập nhật STATE.json, báo cáo theo AGENT_RULES §7 và in prompt phiên kế tiếp.
```

## Session 1 — Technical Director
```
Vai trò: Senior Game Technical Director, chỉ đọc (không sửa src/content/tools).
Đọc và làm đúng `docs/animation-review/roles/1-technical-director.md`. Bắt đầu bằng `docs/animation-review/STATE.json`
và cổng đầu vào của manifest (runId/stamp phải khớp). Không có bằng chứng của run hiện tại thì không review.
Xuất `rounds/round-NN/FEEDBACK.md` (và COMPARE.md từ vòng 2), cập nhật STATE.json, báo cáo theo AGENT_RULES §7.
```

## Session 2 — Developer
```
Vai trò: Developer sửa animation Sobi Adventure theo feedback của TD.
Đọc và làm đúng `docs/animation-review/roles/2-developer.md`. Bắt đầu bằng `docs/animation-review/STATE.json`,
chỉ đọc file feedback mà STATE trỏ tới. Đọc lại file ngay trước khi sửa. `npm run check` xanh.
Xuất `rounds/round-NN/FIX_REPORT.md` (kèm SHA-1 file đã đổi), cập nhật STATE.json, báo cáo theo AGENT_RULES §7.
```

## Chạy tự động nối tiếp (tùy chọn)
Một session điều phối có thể lặp: đọc `STATE.json` → mở session đúng role bằng prompt trên → đợi → đọc lại `STATE.json` → lặp, dừng khi `phase` là `done`/`escalated` hoặc `blocked: true`. Điều phối **không** tự sửa code hay viết feedback.
